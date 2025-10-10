import { Injectable, NotFoundException } from '@nestjs/common';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dtos/create-user.dto';
import { Address } from './entities/address.entity';
import { EntityManager } from '@mikro-orm/postgresql';
import { InjectRepository } from '@mikro-orm/nestjs';
import { UserRepository } from './repositories/user.repository';
import { RedisService } from 'nestjs-redis-client';
import { UpdateUserDto } from './dtos/update-user.dto';
import { Logger } from '@nestjs/common';

@Injectable()
export class UserService {
  constructor(
    private readonly em: EntityManager,
    @InjectRepository(User)
    private readonly userRepo: UserRepository,
    @InjectRepository(Address)
    private readonly redisService: RedisService,
  ) {}

  logger = new Logger(UserService.name);
  static CACHE_KEY_PREFIX = 'user';

  static getCacheKey(
    key: number | string,
    keyType: 'id' | 'phoneNumber',
  ): string {
    return `${this.CACHE_KEY_PREFIX}:${keyType}:${key}`;
  }

  async create(dto: CreateUserDto): Promise<User> {
    return this.em.transactional(async (em) => {
      this.logger.log('Creating user transactionally', dto);

      let address: Address | null = null;
      const addressDetailsProvided =
        dto.address && Object.keys(dto.address).length > 0;

      if (addressDetailsProvided) {
        const addressRepo = em.getRepository(Address);

        address = addressRepo.create({ ...dto.address });
        em.persist(address);
        this.logger.log('Address entity persisted', { id: address.id });
      }

      const userRepo = em.getRepository(User);

      const existingUser = await userRepo.findByPhoneNumber(dto.phoneNumber);
      if (existingUser) {
        throw new Error(
          `User with phone number ${dto.phoneNumber} already exists.`,
        );
      }

      const user = userRepo.create({
        phoneNumber: dto.phoneNumber,
        name: dto.name,
        locationUrl: dto.locationUrl,
        supermarketName: dto.supermarketName,
        role: dto.role,
        address: address,
      });
      em.persist(user);
      this.logger.log('User entity persisted', { id: user.id });
      return user;
    });
  }
  async findByPhoneNumber(phoneNumber: string): Promise<User> {
    const cachedUser = await this.redisService.get<User>(
      UserService.getCacheKey(phoneNumber, 'phoneNumber'),
    );
    if (cachedUser) return cachedUser;
    const user = await this.userRepo.findByPhoneNumber(phoneNumber);
    if (!user) throw new NotFoundException('User not found');
    await this.redisService.set(
      UserService.getCacheKey(phoneNumber, 'phoneNumber'),
      user,
      3600,
    );
    return user;
  }

  async findById(id: number): Promise<User> {
    const cachedUser = await this.redisService.get<User>(
      UserService.getCacheKey(id, 'id'),
    );
    if (cachedUser) return cachedUser;
    const user = await this.userRepo.findById(id);
    if (!user) throw new NotFoundException('User not found');
    await this.redisService.set(UserService.getCacheKey(id, 'id'), user, 3600);
    return user;
  }

  async updateUserInfo(dto: UpdateUserDto, id: number) {
    return this.em.transactional(async (em) => {
      const userRepo = em.getRepository(User);
      const addressRepo = em.getRepository(Address);
      const user = await userRepo.findOneOrFail(
        { id },
        { populate: ['address'] },
      );
      this.em.assign(user, dto);

      if (dto.address && Object.keys(dto.address).length > 0) {
        if (user.address) {
          em.assign(user.address, dto.address);
        } else {
          const newAddress = addressRepo.create(dto.address);
          user.address = newAddress;
          em.persist(newAddress);
        }
      }
      await em.flush();
      await this.redisService.del(UserService.getCacheKey(id, 'id'));
      return user;
    });
  }

  async findByPhoneNumberWithoutException(
    phoneNumber: string,
  ): Promise<User | null> {
    return this.userRepo.findByPhoneNumberWithAddress(phoneNumber);
  }

  async deleteUser(id: number): Promise<{ message: string }> {
    const deletedRows = await this.userRepo.deleteUser(id);
    if (deletedRows === 0) throw new NotFoundException('User not found');
    await this.redisService.del(UserService.getCacheKey(id, 'id'));
    return { message: 'User deleted successfully' };
  }
}
