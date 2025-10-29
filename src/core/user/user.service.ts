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
import { CreateAddressDto } from './dtos/create-address.dto';
import { RegisterUserDto } from '../authentication/dtos/requests/register-user.dto';
import { GetMeDto } from './dtos/response/get-me.dto';
import { UserDto } from './dtos/response/user.dto';
import { AddressDto } from './dtos/response/address.dto';
import { UpdateAddressDto } from './dtos/update-address.dto';

@Injectable()
export class UserService {
  constructor(
    private readonly entityManager: EntityManager,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Address)
    private readonly addressRepo: Repository<Address>,
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
      });
      await userRepo.save(user);

      this.logger.log('User entity persisted', { id: user.id });
      return user;
    });
  }

  async findByPhoneNumber(
    phoneNumber: string,
    isRegistered?: boolean,
  ): Promise<User> {
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
        supermarketName: true,
        isRegistered,
        updatedAt: true,
        addresses: {
          id: true,
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

  async findById(id: number): Promise<GetMeDto> {
    const cachedUser = await this.redisService.get<GetMeDto>(
      UserService.getCacheKey(id, 'id'),
    );
    if (cachedUser) return cachedUser;

    const queryBuilder = this.userRepo
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.addresses', 'address')
      .where('user.id = :id', { id })
      .andWhere('user.isRegistered = :isRegistered', {
        isRegistered: true,
      })
      .andWhere('user.deletedAt IS NULL')
      .select([
        'user.id',
        'user.name',
        'user.phoneNumber',
        'user.profilePic',
        'user.supermarketName',
        'address.id',
        'address.street',
        'address.district',
        'address.city',
        'address.createdAt',
      ]);

    const user = await queryBuilder.getOne();
    if (!user) throw new NotFoundException('User not found');

    await this.redisService.set(
      UserService.getCacheKey(id, 'id'),
      user,
      this.CACHE_TTL,
    );
    return user as GetMeDto;
  }

  async registerUserInfo(dto: RegisterUserDto, id: number): Promise<User> {
    return this.entityManager.transaction(async (em) => {
      const userRepo = em.getRepository(User);
      const user = await userRepo.findOneOrFail({
        where: { id },
        withDeleted: false,
      });
      if (user.isRegistered) {
        throw new BadRequestException('User is already registered');
      }
      userRepo.merge(user, { ...dto, isRegistered: true });
      if (dto.address) {
        await this.createAddress(id, dto.address, em);
      }
      await this.userRepo.save(user);
      await this.redisService.del(UserService.getCacheKey(id, 'id'));
      return user;
    });
  }

  async updateUser(id: number, dto: UpdateUserDto): Promise<UserDto> {
    return this.entityManager.transaction(async (em) => {
      const userRepo = em.getRepository(User);
      const user = await userRepo.findOneOrFail({
        where: { id },
        withDeleted: false,
        select: {
          id: true,
          name: true,
          phoneNumber: true,
          profilePic: true,
          supermarketName: true,
          isRegistered: false,
          updatedAt: false,
          addresses: { id: true, street: true, district: true, city: true },
        },
        relations: ['addresses'],
      });
      userRepo.merge(user, dto);
      await this.userRepo.save(user);
      await this.redisService.del(UserService.getCacheKey(id, 'id'));
      return user as UserDto;
    });
  }

  async findByPhoneNumberWithoutException(
    phoneNumber: string,
  ): Promise<User | null> {
    return this.userRepo.findOne({
      where: { phoneNumber },
      withDeleted: false,
      relations: ['addresses'],
    });
  }

  async deleteUser(id: number): Promise<{ message: string }> {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    await this.userRepo.softDelete(id);
    await this.redisService.del(UserService.getCacheKey(id, 'id'));

    if (user.profilePic) {
      await this.uploadQueue.add(UPLOAD_JOBS.DELETE_FILES_BULK, {
        objectUrls: [user.profilePic],
        metadata: { targetId: id, targetType: 'user_picture' },
      });
    }
    return { message: 'User soft deleted successfully' };
  }

  async updateUserProfilePic(userId: number, profilePic: Express.Multer.File) {
    const user = await this.userRepo.findOneOrFail({
      where: { id: userId },
      select: ['id', 'profilePic'],
      withDeleted: false,
    });
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
    if (user.profilePic)
      await this.uploadQueue.add(UPLOAD_JOBS.DELETE_FILES_BULK, {
        objectUrls: [user.profilePic],
        metadata: { targetId: userId, targetType: 'user_picture' },
      });
    await this.redisService.del(UserService.getCacheKey(userId, 'id'));
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

  async createAddress(
    userId: number,
    createAddressDto: CreateAddressDto,
    emGlobal?: EntityManager,
  ): Promise<AddressDto> {
    return this.entityManager.transaction(async (emLocal) => {
      const em = emGlobal || emLocal;
      const addressRepo = em.getRepository(Address);
      const address = addressRepo.create({ ...createAddressDto, userId });
      const created = await addressRepo.save(address);
      const { id, street, district, city } = created;
      return { id, street, district, city } as AddressDto;
    });
  }

  async getAddresses(userId: number): Promise<AddressDto[]> {
    const addresses = await this.addressRepo.find({
      where: { userId },
      select: {
        id: true,
        street: true,
        district: true,
        city: true,
        createdAt: true,
        updatedAt: false,
      },
      order: { createdAt: 'DESC' },
    });
    return addresses as AddressDto[];
  }

  async updateAddress(
    userId: number,
    addressId: number,
    updateAddressDto: UpdateAddressDto,
  ): Promise<AddressDto> {
    const address = await this.addressRepo.findOneOrFail({
      where: { id: addressId, userId },
    });
    this.addressRepo.merge(address, updateAddressDto);
    const updatedAdress = await this.addressRepo.save(address);
    const { id, street, district, city } = updatedAdress;
    return { id, street, district, city, userId } as AddressDto;
  }

  async deleteAddress(userId: number, addressId: number) {
    const userAddressesCount = await this.addressRepo.count({
      where: { userId },
    });
    if (userAddressesCount <= 1) {
      throw new BadRequestException(
        'Cannot delete the only address associated with the user',
      );
    }
    await this.addressRepo.delete(addressId);
    return { message: 'Address deleted successfully' };
  }

  async isUserRegistered(userId: number): Promise<boolean> {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      select: ['isRegistered'],
      withDeleted: false,
    });
    console.log('User registration status:', user?.isRegistered);

    return user?.isRegistered ?? false;
  }
}
