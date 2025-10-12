import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dtos/create-user.dto';
import { Address } from './entities/address.entity';
import { RedisService } from 'nestjs-redis-client';
import { UpdateUserDto } from './dtos/update-user.dto';

@Injectable()
export class UserService {
  constructor(
    private readonly entityManager: EntityManager,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly redisService: RedisService,
  ) {}

  private readonly logger = new Logger(UserService.name);
  static CACHE_KEY_PREFIX = 'user';
  private readonly CACHE_TTL = 60 * 10;
  static getCacheKey(
    key: number | string,
    keyType: 'id' | 'phoneNumber',
  ): string {
    return `${this.CACHE_KEY_PREFIX}:${keyType}:${key}`;
  }

  async create(dto: CreateUserDto): Promise<User> {
    return this.entityManager.transaction(async (em) => {
      this.logger.log('Creating user transactionally', dto);

      let address: Address | null = null;
      const addressDetailsProvided =
        dto.address && Object.keys(dto.address).length > 0;

      if (addressDetailsProvided) {
        const addressRepo = em.getRepository(Address);
        address = addressRepo.create({ ...dto.address });
        await addressRepo.save(address);
        this.logger.log('Address entity persisted', { id: address.id });
      }

      const userRepo = em.getRepository(User);

      const existingUser = await userRepo.findOneBy({
        phoneNumber: dto.phoneNumber,
      });
      if (existingUser) {
        throw new Error(
          `User with phone number ${dto.phoneNumber} already exists.`,
        );
      }

      const user = userRepo.create({
        ...dto,
        address: address || undefined,
      });
      await userRepo.save(user);
      this.logger.log('User entity persisted', { id: user.id });
      return user;
    });
  }

  async findByPhoneNumber(phoneNumber: string): Promise<User> {
    const cachedUser = await this.redisService.get<User>(
      UserService.getCacheKey(phoneNumber, 'phoneNumber'),
    );
    if (cachedUser) return cachedUser;

    const user = await this.userRepo.findOne({
      where: { phoneNumber },
      relations: ['addresses'],
      select: {
        profilePic: true,
        name: true,
        phoneNumber: true,
        id: true,
        locationUrl: true,
        supermarketName: true,
        updatedAt: true,
        address: {
          id: false,
          district: true,
          city: true,
          street: true,
          createdAt: false,
          updatedAt: false,
        },
      },
    });
    if (!user) throw new NotFoundException('User not found');

    await this.redisService.set(
      UserService.getCacheKey(phoneNumber, 'phoneNumber'),
      user,
      this.CACHE_TTL,
    );
    return user;
  }

  async findById(id: number): Promise<User> {
    const cachedUser = await this.redisService.get<User>(
      UserService.getCacheKey(id, 'id'),
    );
    if (cachedUser) return cachedUser;

    const user = await this.userRepo.findOne({
      where: { id },
      relations: ['address'],
      select: {
        profilePic: true,
        name: true,
        phoneNumber: true,
        id: true,
        locationUrl: true,
        supermarketName: true,
        updatedAt: true,
        address: {
          id: false,
          district: true,
          city: true,
          street: true,
          createdAt: false,
          updatedAt: false,
        },
      },
    });
    await this.redisService.set(
      UserService.getCacheKey(id, 'id'),
      user,
      this.CACHE_TTL,
    );
    return user as User;
  }

  async updateUserInfo(dto: UpdateUserDto, id: number): Promise<User> {
    return this.entityManager.transaction(async (em) => {
      const userRepo = em.getRepository(User);
      const addressRepo = em.getRepository(Address);
      const user = await userRepo.findOneOrFail({
        where: { id },
        relations: ['address'],
      });

      userRepo.merge(user, dto);

      if (dto.address && Object.keys(dto.address).length > 0) {
        if (user.address) {
          addressRepo.merge(user.address, dto.address);
          await addressRepo.save(user.address);
        } else {
          const newAddress = addressRepo.create(dto.address);
          user.address = newAddress;
          await addressRepo.save(newAddress);
        }
      }
      await userRepo.save(user);
      await this.redisService.del(UserService.getCacheKey(id, 'id'));
      return user;
    });
  }

  async findByPhoneNumberWithoutException(
    phoneNumber: string,
  ): Promise<User | null> {
    return this.userRepo.findOne({
      where: { phoneNumber },
      relations: ['address'],
    });
  }

  async deleteUser(id: number): Promise<{ message: string }> {
    const result = await this.userRepo.delete(id);
    if (result.affected === 0) throw new NotFoundException('User not found');
    await this.redisService.del(UserService.getCacheKey(id, 'id'));
    return { message: 'User deleted successfully' };
  }
}
