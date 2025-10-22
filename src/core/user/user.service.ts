import {
  Injectable,
  NotFoundException,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dtos/create-user.dto';
import { Address } from './entities/address.entity';
import { RedisService } from 'nestjs-redis-client';
import { UpdateUserDto } from './dtos/update-user.dto';
import { InjectQueue } from '@nestjs/bullmq';
import { QUEUE_NAME } from 'src/common/constants/queues';
import { Queue } from 'bullmq';
import { ObjectService } from 'src/infrastructure/object-storage/object-storage.service';
import { UPLOAD_JOBS } from 'src/common/constants/jobs';
import { OnEvent } from '@nestjs/event-emitter';
import { FinalizePayloadDto } from 'src/infrastructure/queue/upload/dto/finalize-payload.dto';

@Injectable()
export class UserService {
  constructor(
    private readonly entityManager: EntityManager,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly redisService: RedisService,
    @InjectQueue(QUEUE_NAME.UPLOAD)
    private readonly uploadQueue: Queue,
    private readonly objectService: ObjectService,
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
      let address: Address | null = null;
      const addressDetailsProvided =
        dto.address && Object.keys(dto.address).length > 0;
      if (addressDetailsProvided) {
        const addressRepo = em.getRepository(Address);
        address = addressRepo.create({ ...dto.address });
        await addressRepo.save(address);
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
      withDeleted: false,
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
      withDeleted: false,
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
        withDeleted: false,
        relations: ['address'],
      });

      // if (user.updatedAt === user.createdAt) {
      //   throw new BadRequestException('User already registered');
      // }

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

  async registgerUserInfo(dto: UpdateUserDto, id: number): Promise<User> {
    return this.entityManager.transaction(async (em) => {
      const userRepo = em.getRepository(User);
      const addressRepo = em.getRepository(Address);
      const user = await userRepo.findOneOrFail({
        where: { id },
        withDeleted: false,
        relations: ['address'],
      });

      if (user.updatedAt !== user.createdAt) {
        throw new BadRequestException('User already registered');
      }

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
      withDeleted: false,
      relations: ['address'],
    });
  }

  //TODO: delete address too
  async deleteUser(id: number): Promise<{ message: string }> {
    await this.userRepo.softDelete(id);
    await this.redisService.del(UserService.getCacheKey(id, 'id'));
    return { message: 'User deleted successfully (soft delete)' };
  }

  async getDefaultAddress(userId: number, em?: EntityManager): Promise<number> {
    const userRepository = em ? em.getRepository(User) : this.userRepo;
    const user = await userRepository.findOne({
      where: { id: userId },
      relations: ['address'],
    });
    const id = user?.address?.id;
    if (!id) {
      throw new NotFoundException('Default address not found for user');
    }
    return id;
  }
  async updateUserProfilePic(userId: number, profilePic: Express.Multer.File) {
    const objectName = this.objectService.generateUniqueObjectName(
      profilePic.originalname,
    );
    const presignedUrl = this.objectService.getFileUrl(objectName);
    await this.userRepo.update(userId, { profilePic: presignedUrl });

    await this.uploadQueue.add(UPLOAD_JOBS.UPLOAD_FILE, {
      file: profilePic,
      options: { objectName },
      metadata: { targetId: userId, targetType: 'user_picture' },
    });
    return { profilePic: presignedUrl };
  }

  private async setProfilePicUrlNull(userId: number) {
    await this.userRepo.update(userId, { profilePic: undefined });
    await this.redisService.del(UserService.getCacheKey(userId, 'id'));
  }

  @OnEvent('file.failed.user_picture', { async: true })
  async finalizeUser(payload: FinalizePayloadDto) {
    this.logger.log(
      `Finalizing user profile pic upload for user ID: ${payload.targetId}`,
    );
    await this.setProfilePicUrlNull(payload.targetId);
  }
}
