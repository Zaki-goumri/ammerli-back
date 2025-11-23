import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  PaginationQueryDto,
  PaginationResponseDto,
} from 'src/common/dtos/pagination.dto';
import { In, IsNull, Not, Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { BlackListDto } from './dtos/black-list.dto';
import { GetBlackListedUserDto } from './dtos/get-black-listed-user.dto';
import { RedisService } from 'nestjs-redis-client';
import { ConfigService } from '@nestjs/config';
import { UserRole } from 'src/common/enums/user-role.enum';
import { I18nService } from 'nestjs-i18n';

@Injectable()
export class BlackListService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
    private readonly i18nService: I18nService,
  ) {}

  static CACHE_KEY_PREFIX = 'blacklist';
  private readonly CACHE_TTL =
    this.configService.get<number>('BLACKLIST_CACHE_TTL_SECONDS') || 60 * 5; // 5 minutes

  static getCacheKey(phoneNumber: string): string {
    return `${this.CACHE_KEY_PREFIX}:${phoneNumber}`;
  }

  async create(userId: number): Promise<BlackListDto> {
    const user = await this.userRepo.findOneBy({ id: userId });
    if (!user) {
      throw new NotFoundException(
        this.i18nService.t('user.notFoundById', { args: { id: userId } }),
      );
    }
    user.blackListedAt = new Date();
    const savedUser = await this.userRepo.save(user);
    await this.redisService.del(BlackListService.getCacheKey(user.phoneNumber));
    return {
      id: savedUser.id,
      userId: savedUser.id,
    };
  }

  async getManyWithPagination(
    paginationQuery: PaginationQueryDto,
  ): Promise<PaginationResponseDto<GetBlackListedUserDto>> {
    const { limit, page } = paginationQuery;

    const [users, total] = await this.userRepo.findAndCount({
      where: {
        blackListedAt: Not(IsNull()),
        deletedAt: IsNull(),
      },
      order: { blackListedAt: 'DESC' },
      take: limit,
      skip: (page - 1) * limit,
    });

    const blackListDtos: GetBlackListedUserDto[] = users.map((user) => ({
      id: user.id,
      userId: user.id,
      name: user.name as string,
      role: user.role as UserRole,
      phoneNumber: user.phoneNumber,
    }));

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

  async restore(userId: number): Promise<{ message: string }> {
    const phoneNumber = await this.userRepo.manager.transaction(
      async (entityManager) => {
        const result = await entityManager.update(
          User,
          {
            id: userId,
            blackListedAt: Not(IsNull()),
            deletedAt: IsNull(),
          },
          { blackListedAt: null },
        );

        if (result.affected === 0) {
          throw new NotFoundException(
            this.i18nService.t('blacklist.restore.notFoundOrDeleted', {
              args: { id: userId },
            }),
          );
        }

        const user = await entityManager.findOneOrFail(User, {
          where: { id: userId },
          select: ['phoneNumber'],
        });

        return user.phoneNumber;
      },
    );

    await this.redisService.del(BlackListService.getCacheKey(phoneNumber));

    return { message: this.i18nService.t('blacklist.restore.success') };
  }

  async isPhoneNumberBlacklisted(phoneNumber: string): Promise<boolean> {
    const cachedStatus = await this.redisService.get<boolean>(
      BlackListService.getCacheKey(phoneNumber),
    );
    if (cachedStatus !== null) {
      return cachedStatus;
    }

    const user = await this.userRepo.findOne({
      where: { phoneNumber },
    });

    const isBlacklisted = !!user && !!user?.blackListedAt && !user?.deletedAt;

    await this.redisService.set(
      BlackListService.getCacheKey(phoneNumber),
      isBlacklisted,
      this.CACHE_TTL,
    );
    return isBlacklisted;
  }

  async bulkDelete(userIds: number[]): Promise<{ deletedCount: number }> {
    const users = await this.userRepo.find({
      where: {
        id: In(userIds),
        blackListedAt: Not(IsNull()),
        deletedAt: IsNull(),
      },
    });

    if (users.length === 0) {
      throw new NotFoundException(
        this.i18nService.t('blacklist.bulkDelete.noUsersFound'),
      );
    }

    const currentDate = new Date();
    users.forEach((user) => {
      user.deletedAt = currentDate;
    });

    await this.userRepo.save(users);

    await Promise.allSettled(
      users.map((user) =>
        this.redisService.del(BlackListService.getCacheKey(user.phoneNumber)),
      ),
    );

    return { deletedCount: users.length };
  }
}
