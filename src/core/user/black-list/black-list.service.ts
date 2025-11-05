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

@Injectable()
export class BlackListService {
  constructor(
    @InjectRepository(BlackList)
    private readonly blackListRepository: Repository<BlackList>,
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
  ) {}

  async create(userId: number): Promise<BlackListDto> {
    const blackListItem = this.blackListRepository.create({ userId });
    const savedItem = await this.blackListRepository.save(blackListItem);
    await this.userService.deleteUser(userId);
    return {
      id: savedItem.id,
      userId: savedItem.userId,
    };
  }

  async getManyWithPagination(
    paginationQuery: PaginationQueryDto,
  ): Promise<PaginationResponseDto<GetBlackListedUserDto>> {
    const { limit, page } = paginationQuery;
    const queryBuilder = this.blackListRepository
      .createQueryBuilder('black_list')
      .leftJoinAndSelect('black_list.user', 'user')
      .select([
        'black_list.id',
        'black_list.userId',
        'user.name',
        'user.phoneNumber',
      ]);

    const [data, total] = await Promise.all([
      queryBuilder
        .orderBy('black_list.createdAt', 'DESC')
        .take(limit)
        .skip((page - 1) * limit)
        .getRawAndEntities(),
      queryBuilder.getCount(),
    ]);

    const blackListDtos: GetBlackListedUserDto[] = data.entities.map(
      (item) => ({
        id: item?.id,
        userId: item?.userId,
        name: item?.user?.name as string,
        phoneNumber: item?.user?.phoneNumber,
      }),
    );

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

  async remove(id: number): Promise<{ message: string }> {
    const result = await this.blackListRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Blacklist item with ID ${id} not found`);
    }
    return { message: 'Blacklist item removed successfully' };
  }

  async restore(userId: number): Promise<{ message: string }> {
    const blackListEntry = await this.blackListRepository.findOneBy({ userId });
    if (!blackListEntry) {
      throw new NotFoundException(
        `User with ID ${userId} is not in the blacklist.`,
      );
    }

    await this.blackListRepository.delete({ userId });
    await this.userService.restoreUser(userId);

    return { message: 'User restored and removed from blacklist successfully' };
  }

  async isPhoneNumberBlacklisted(phoneNumber: string): Promise<boolean> {
    const user =
      await this.userService.findUserByPhoneNumberWithDeleted(phoneNumber);
    if (!user) {
      return false;
    }
    const count = await this.blackListRepository.count({
      where: { userId: user.id },
    });
    return count > 0;
  }
}
