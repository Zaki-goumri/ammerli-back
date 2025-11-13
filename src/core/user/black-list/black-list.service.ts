import {
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  PaginationQueryDto,
  PaginationResponseDto,
} from 'src/common/dtos/pagination.dto';
import { Repository } from 'typeorm';
import { UserService } from '../user.service';
import { BlackListDto } from './dtos/black-list.dto';
import { GetBlackListedUserDto } from './dtos/get-black-listed-user.dto';
import { BlackList } from './entities/black-list.entity';
import { User } from '../entities/user.entity';
import { RedisService } from 'nestjs-redis-client';
import { ConfigService } from '@nestjs/config';

/**
 * @class BlackListService
 * @description Manages operations related to blacklisting users, including adding, retrieving,
 *              restoring, and checking the blacklist status of phone numbers.
 */
@Injectable()
export class BlackListService {
  constructor(
    @InjectRepository(BlackList)
    private readonly blackListRepository: Repository<BlackList>,
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
  ) {}

  static CACHE_KEY_PREFIX = 'blacklist';
  private readonly CACHE_TTL =
    this.configService.get<number>('BLACKLIST_CACHE_TTL_SECONDS') || 60 * 5; // 5 minutes

  static getCacheKey(phoneNumber: string): string {
    return `${this.CACHE_KEY_PREFIX}:${phoneNumber}`;
  }

  /**
   * @method create
   * @description Adds a user to the blacklist and soft-deletes their user account.
   * @param {number} userId - The ID of the user to blacklist.
   * @returns {Promise<BlackListDto>} The DTO of the newly created blacklist entry.
   */
  async create(userId: number): Promise<BlackListDto> {
    const user = await this.userService.findUserEntityById(userId); // Fetch user to get phone number for cache invalidation
    const blackListItem = this.blackListRepository.create({ userId });
    const savedItem = await this.blackListRepository.save(blackListItem);
    await this.userService.deleteUser(userId);
    await this.redisService.del(BlackListService.getCacheKey(user.phoneNumber)); // Invalidate cache
    return {
      id: savedItem.id,
      userId: savedItem.userId,
    };
  }

  /**
   * @method getManyWithPagination
   * @description Retrieves a paginated list of blacklisted users with their details.
   * @param {PaginationQueryDto} paginationQuery - Pagination parameters (limit, page).
   * @returns {Promise<PaginationResponseDto<GetBlackListedUserDto>>} A paginated list of blacklisted user DTOs.
   */
  async getManyWithPagination(
    paginationQuery: PaginationQueryDto,
  ): Promise<PaginationResponseDto<GetBlackListedUserDto>> {
    const { limit, page } = paginationQuery;

    const [blackList, total] = await this.blackListRepository.findAndCount({
      order: { createdAt: 'DESC' },
      take: limit,
      skip: (page - 1) * limit,
    });

    if (blackList.length === 0) {
      return {
        meta: {
          total,
          page,
          limit,
          totalPages: 0,
          hasNextPage: false,
        },
        data: [],
      };
    }

    const userIds = blackList.map((bl) => bl.userId);
    const users = await this.blackListRepository.manager
      .createQueryBuilder(User, 'user')
      .where('user.id IN (:...ids)', { ids: userIds })
      .withDeleted()
      .getMany();

    const userMap = new Map(users.map((u) => [u.id, u]));

    const blackListDtos: GetBlackListedUserDto[] = blackList.map((item) => {
      const user = userMap.get(item.userId);
      return {
        id: item.id,
        userId: item.userId,
        name: user?.name as string,
        phoneNumber: user?.phoneNumber as string,
      };
    });

    return {
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
      },
      data: blackListDtos,
    };
  }

  /**
   * @method restore
   * @description Removes a user from the blacklist and restores their soft-deleted user account.
   * @param {number} userId - The ID of the user to restore.
   * @returns {Promise<{ message: string }>} A success message.
   * @throws {NotFoundException} If the user is not found in the blacklist.
   */
  async restore(userId: number): Promise<{ message: string }> {
    const blackListEntry = await this.blackListRepository.findOneBy({ userId });
    if (!blackListEntry) {
      throw new NotFoundException(
        `User with ID ${userId} is not in the blacklist.`,
      );
    }
    const user = await this.userService.findUserEntityById(userId); // Fetch user to get phone number for cache invalidation
    await this.blackListRepository.delete({ userId });
    await this.userService.restoreUser(userId);
    await this.redisService.del(BlackListService.getCacheKey(user.phoneNumber)); // Invalidate cache
    return { message: 'User restored and removed from blacklist successfully' };
  }

  /**
   * @method isPhoneNumberBlacklisted
   * @description Checks if a given phone number belongs to a blacklisted user.
   * @param {string} phoneNumber - The phone number to check.
   * @returns {Promise<boolean>} True if the phone number is blacklisted, false otherwise.
   */
  async isPhoneNumberBlacklisted(phoneNumber: string): Promise<boolean> {
    const cachedStatus = await this.redisService.get<boolean>(
      BlackListService.getCacheKey(phoneNumber),
    );
    if (cachedStatus !== null) {
      return cachedStatus;
    }

    const user =
      await this.userService.findUserByPhoneNumberWithDeleted(phoneNumber);
    if (!user) {
      await this.redisService.set(
        BlackListService.getCacheKey(phoneNumber),
        false,
        this.CACHE_TTL,
      );
      return false;
    }
    const count = await this.blackListRepository.count({
      where: { userId: user.id },
    });
    const isBlacklisted = count > 0;
    await this.redisService.set(
      BlackListService.getCacheKey(phoneNumber),
      isBlacklisted,
      this.CACHE_TTL,
    );
    return isBlacklisted;
  }
}
