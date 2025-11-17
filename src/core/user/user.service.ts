import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserForAdminDto } from './dtos/response/user-for-admin.dto';
import {
  PaginationQueryDto,
  PaginationResponseDto,
} from 'src/common/dtos/pagination.dto';
import { User } from './entities/user.entity';
import { EntityManager, In, Repository } from 'typeorm';
import { Address } from './entities/address.entity';
import { RedisService } from 'nestjs-redis-client';
import { QUEUE_NAME } from 'src/common/constants/queues';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { ObjectService } from 'src/infrastructure/object-storage/object-storage.service';
import { GetMeDto } from './dtos/response/get-me.dto';
import { RegisterUserDto } from '../authentication/dtos/requests/register-user.dto';
import { UPLOAD_JOBS } from 'src/common/constants/jobs';
import { FinalizePayloadDto } from 'src/infrastructure/queue/upload/dto/finalize-payload.dto';
import { CreateAddressDto } from './dtos/create-address.dto';
import { AddressDto } from './dtos/response/address.dto';
import { UpdateAddressDto } from './dtos/update-address.dto';
import { UpdateUserDto } from './dtos/update-user.dto';
import { UserDto } from './dtos/response/user.dto';
import { CreateUserDto } from './dtos/create-user.dto';
import { OnEvent } from '@nestjs/event-emitter';
import { USER_ROLES, UserRole } from 'src/common/enums/user-role.enum';
import { UserDetailForAdminDto } from './dtos/response/user-detail-for-admin.dto';
import { ConfigService } from '@nestjs/config';
import { plainToInstance } from 'class-transformer';
import { NotificationsService } from '../notifications/notifications.service';
import { forkJoin, from, lastValueFrom, Observable, of } from 'rxjs';
import { catchError, map, retry } from 'rxjs/operators';
import { NOTIFICATION_TYPE } from '../notifications/enums/notification-type.enum';
import { MessageDto } from './dtos/response/message.dto';

/**
 * @class UserService
 * @description Handles all user-related business logic, including CRUD operations, address management,
 *              profile picture uploads, and integration with caching and blacklisting services.
 */
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
    private readonly configService: ConfigService,
    private readonly notificationsService: NotificationsService,
  ) {}

  private readonly logger = new Logger(UserService.name);
  static CACHE_KEY_PREFIX = 'user';
  private readonly CACHE_TTL =
    this.configService.get<number>('CACHE_TTL_SECONDS') || 60 * 10;

  /**
   * @method getCacheKey
   * @description Generates a cache key for user data based on ID or phone number.
   * @param {number | string} key - The user's ID or phone number.
   * @param {'id' | 'phoneNumber'} keyType - The type of key being used ('id' or 'phoneNumber').
   * @returns {string} The generated cache key.
   */
  static getCacheKey(
    key: number | string,
    keyType: 'id' | 'phoneNumber' | 'admin-details',
  ): string {
    return `${this.CACHE_KEY_PREFIX}:${keyType}:${key}`;
  }

  /**
   * @method create
   * @description Creates a new user in the database. Performs a blacklist check and ensures
   *              no user with the same phone number already exists.
   * @param {CreateUserDto} dto - The data transfer object containing user creation details.
   * @returns {Promise<User>} The newly created user entity.
   * @throws {ForbiddenException} If the phone number is blacklisted.
   * @throws {ConflictException} If a user with the provided phone number already exists.
   */
  async create(dto: CreateUserDto): Promise<User> {
    return this.entityManager.transaction(async (em) => {
      const userRepo = em.getRepository(User);

      const existingUser = await userRepo.findOneBy({
        phoneNumber: dto.phoneNumber,
      });
      if (existingUser) {
        throw new ConflictException(
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

  /**
   * @method registerUserInfo
   * @description Registers additional user information after initial phone number validation.
   *              Updates the user's details and sets `isRegistered` to true.
   * @param {RegisterUserDto} dto - The data transfer object containing registration details.
   * @param {number} id - The ID of the user to register.
   * @returns {Promise<User>} The updated user entity.
   * @throws {BadRequestException} If the user is already registered.
   * @throws {NotFoundException} If the user with the provided ID is not found.
   */
  async registerUserInfo(
    dto: RegisterUserDto & { phoneNumber: string },
  ): Promise<User> {
    return this.entityManager.transaction(async (em) => {
      const userRepo = em.getRepository(User);
      const user = userRepo.create({ ...dto });
      const { id } = await userRepo.save(user);
      if (dto.address) {
        await this.createAddress(id, dto.address, em);
      }
      await this.redisService.del(UserService.getCacheKey(id, 'id'));
      await this.redisService.del(UserService.getCacheKey(id, 'admin-details'));
      return user;
    });
  }

  /**
   * @method findByPhoneNumber
   * @description Retrieves a user by their phone number, utilizing Redis cache.
   * @param {string} phoneNumber - The phone number of the user to find.
   * @param {boolean} [isRegistered] - Optional flag to filter by registration status.
   * @returns {Promise<User>} The found user entity.
   * @throws {NotFoundException} If no user is found with the provided phone number.
   */
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
        supermarketName: true,
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

    if (user.profilePic) {
      user.profilePic = await this.objectService.getPresignedUrl(
        user.profilePic,
      );
    }

    await this.redisService.set(
      UserService.getCacheKey(phoneNumber, 'phoneNumber'),
      user,
      this.CACHE_TTL,
    );
    return user;
  }

  /**
   * @method findById
   * @description Retrieves a user by their ID, utilizing Redis cache.
   * @param {number} id - The ID of the user to find.
   * @returns {Promise<GetMeDto>} The found user's profile data.
   * @throws {NotFoundException} If no user is found with the provided ID.
   */
  async findById(id: number): Promise<GetMeDto> {
    const cachedUser = await this.redisService.get<GetMeDto>(
      UserService.getCacheKey(id, 'id'),
    );
    if (cachedUser) return cachedUser;

    const queryBuilder = this.userRepo
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.addresses', 'address')
      .where('user.id = :id', { id })
      .andWhere('user.deletedAt IS NULL')
      .select([
        'user.id',
        'user.name',
        'user.role',
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

    if (user.profilePic) {
      user.profilePic = await this.objectService.getPresignedUrl(
        user.profilePic,
      );
    }

    await this.redisService.set(
      UserService.getCacheKey(id, 'id'),
      user,
      this.CACHE_TTL,
    );
    return user as GetMeDto;
  }

  /**
   * @method findUserEntityById
   * @description Retrieves a user entity by ID without transforming it into a DTO.
   * @param {number} id - The ID of the user to find.
   * @returns {Promise<User>} The found user entity.
   * @throws {NotFoundException} If no user is found with the provided ID.
   */
  async findUserEntityById(id: number): Promise<User> {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  /**
   * @method getUserDetailsForAdmin
   * @description Retrieves detailed information for a specific user, intended for admin view.
   *              Transforms the user entity into `UserDetailForAdminDto`.
   * @param {number} userId - The ID of the user whose details are to be retrieved.
   * @returns {Promise<UserDetailForAdminDto>} The detailed user information for admin.
   * @throws {NotFoundException} If no user is found with the provided ID.
   */
  async getUserDetailsForAdmin(userId: number): Promise<UserDetailForAdminDto> {
    const cacheKey = UserService.getCacheKey(userId, 'admin-details');
    const cachedUserDetail =
      await this.redisService.get<UserDetailForAdminDto>(cacheKey);
    if (cachedUserDetail) {
      return cachedUserDetail;
    }

    const user = await this.userRepo.findOneOrFail({
      where: { id: userId },
      relations: ['addresses'],
      withDeleted: true,
      order: {
        addresses: {
          createdAt: 'DESC',
        },
      },
      select: {
        id: true,
        name: true,
        supermarketName: true,
        phoneNumber: true,
        createdAt: true,
        role: true,
        deletedAt: true,
        profilePic: true,
        addresses: {
          id: true,
          street: true,
          district: true,
          city: true,
          createdAt: true,
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    const lastAddress =
      user.addresses && user.addresses.length > 0 ? user.addresses[0] : null;

    let presignedProfilePic = '';
    if (user.profilePic) {
      presignedProfilePic = await this.objectService.getPresignedUrl(
        user.profilePic,
      );
    }

    const userDetail = plainToInstance(UserDetailForAdminDto, {
      ...user,
      lastAddress,
      profilePic: presignedProfilePic,
      isActive: !user.deletedAt,
    });

    await this.redisService.set(cacheKey, userDetail, this.CACHE_TTL);
    return userDetail;
  }

  /**
   * @method updateUser
   * @description Updates a user's profile information.
   * @param {number} id - The ID of the user to update.
   * @param {UpdateUserDto} dto - The data transfer object containing user update details.
   * @returns {Promise<UserDto>} The updated user's profile data.
   * @throws {NotFoundException} If the user with the provided ID is not found.
   */
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
          updatedAt: false,
          addresses: { id: true, street: true, district: true, city: true },
        },
        relations: ['addresses'],
      });
      userRepo.merge(user, dto);
      await this.userRepo.save(user);
      await this.redisService.del(UserService.getCacheKey(id, 'id'));
      await this.redisService.del(UserService.getCacheKey(id, 'admin-details')); // Invalidate admin details cache
      return user as UserDto;
    });
  }

  /**
   * @method findByPhoneNumberWithoutException
   * @description Retrieves a user by their phone number without throwing an exception if not found.
   * @param {string} phoneNumber - The phone number of the user to find.
   * @returns {Promise<User | null>} The found user entity or null if not found.
   */
  async findByPhoneNumberWithoutException(
    phoneNumber: string,
  ): Promise<User | null> {
    return this.userRepo.findOne({
      where: { phoneNumber },
      withDeleted: false,
      relations: ['addresses'],
    });
  }

  /**
   * @method findUserByPhoneNumberWithDeleted
   * @description Retrieves a user by their phone number, including soft-deleted users.
   * @param {string} phoneNumber - The phone number of the user to find.
   * @returns {Promise<User | null>} The found user entity (including deleted ones) or null if not found.
   */
  async findUserByPhoneNumberWithDeleted(
    phoneNumber: string,
  ): Promise<User | null> {
    return this.userRepo.findOne({
      where: { phoneNumber },
      withDeleted: true,
    });
  }

  /**
   * @method deleteUser
   * @description Soft-deletes a user by their ID and queues a job to delete their profile picture.
   * @param {number} id - The ID of the user to soft-delete.
   * @returns {Promise<{ message: string }>} A success message.
   * @throws {NotFoundException} If the user with the provided ID is not found.
   */
  async deleteUser(id: number): Promise<{ message: string }> {
    await this.redisService.del(UserService.getCacheKey(id, 'id'));
    await this.redisService.del(UserService.getCacheKey(id, 'admin-details'));
    const user = await this.entityManager.transaction(async (manager) => {
      const u = await manager.findOne(User, { where: { id } });
      if (!u) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }

      await manager.softDelete(User, { id });
      await manager.softDelete(Address, { userId: id });

      return u;
    });

    if (user.profilePic) {
      await this.uploadQueue.add(UPLOAD_JOBS.DELETE_FILES_BULK, {
        objectUrls: [user.profilePic],
        metadata: { targetId: id, targetType: 'user_picture' },
      });
    }
    return { message: 'User soft deleted successfully' };
  }

  /**
   * @method deleteBulk
   * @description Soft-deletes multiple users by their IDs, handles associated profile pictures, and notifies on partial failures.
   * @param {number[]} userIds - An array of user IDs to soft-delete.
   * @param {number} currentAdminId - The ID of the admin initiating the bulk delete.
   * @returns {Promise<MessageDto>} A message summarizing the bulk delete operation.
   * @throws {NotFoundException} If no valid users are found for deletion.
   * @throws {ForbiddenException} If the operation would result in zero administrators.
   */
  async deleteBulk(
    userIds: number[],
    currentAdminId: number,
  ): Promise<MessageDto> {
    const filteredUserIds = userIds.filter((id) => id !== currentAdminId);
    if (filteredUserIds.length === 0 && userIds.length > 0) {
      return { message: 'Admin cannot delete their own account.' };
    }

    const usersToDelete = await this.userRepo.find({
      where: { id: In(filteredUserIds) },
    });

    if (usersToDelete.length === 0) {
      throw new NotFoundException('No valid users found for deletion.');
    }

    // 2. "At least one admin" check
    const adminsToDeleteCount = usersToDelete.filter(
      (user) => user.role === USER_ROLES.ADMIN,
    ).length;
    const totalAdminsCount = await this.userRepo.count({
      where: { role: USER_ROLES.ADMIN },
    });

    if (totalAdminsCount - adminsToDeleteCount < 1) {
      throw new ForbiddenException('Cannot delete all admins in the system.');
    }

    // 3. Object Storage Deletion with RxJS
    const profilePicsToDelete = usersToDelete
      .map((user) => user.profilePic)
      .filter((pic): pic is string => !!pic);

    if (profilePicsToDelete.length > 0) {
      const deleteJobs$: Observable<any>[] = profilePicsToDelete.map((pic) =>
        from(
          this.uploadQueue.add(UPLOAD_JOBS.DELETE_FILE, {
            objectName: pic,
          }),
        ).pipe(retry(3)),
      );
      await lastValueFrom(forkJoin(deleteJobs$));
      this.logger.log(
        `Queued ${profilePicsToDelete.length} profile pictures for deletion.`,
      );
    }

    const deletionObservables = usersToDelete.map((user) =>
      from(this.userRepo.softDelete(user.id)).pipe(
        retry(3),
        map(() => ({ id: user.id, status: 'fulfilled' })),
        catchError((error) => {
          this.logger.error(
            `Failed to delete user ${user.id} after 3 retries`,
            error,
          );
          return of({ id: user.id, status: 'rejected' });
        }),
      ),
    );

    const results = await lastValueFrom(forkJoin(deletionObservables));

    const successfulDeletes: number[] = [];
    const failedDeletes: number[] = [];

    results.forEach((result) => {
      if (result.status === 'fulfilled') {
        successfulDeletes.push(result.id);
      } else {
        failedDeletes.push(result.id);
      }
    });

    const cacheKeys = successfulDeletes.flatMap((id) => [
      UserService.getCacheKey(id, 'id'),
      UserService.getCacheKey(id, 'admin-details'),
    ]);
    if (cacheKeys.length > 0) {
      Promise.allSettled(cacheKeys.map((key) => this.redisService.del(key)));
    }

    if (failedDeletes.length > 0) {
      await this.notificationsService.sendNotification(
        'Bulk Deletion Partially Failed',
        `Failed to delete the following user IDs: ${failedDeletes.join(
          ', ',
        )}. Please check the logs.`,
        currentAdminId,
        NOTIFICATION_TYPE.ADMIN_ALERTS,
      );
    }

    return {
      message: `Bulk delete process completed. Successfully deleted: ${successfulDeletes.length}. Failed: ${failedDeletes.length}.`,
    };
  }

  /**
   * @method restoreUser
   * @description Restores a soft-deleted user by their ID.
   * @param {number} id - The ID of the user to restore.
   * @returns {Promise<{ message: string }>} A success message.
   * @throws {NotFoundException} If the user with the provided ID is not found or not deleted.
   */
  async restoreUser(id: number): Promise<{ message: string }> {
    const restoreResult = await this.userRepo.restore(id);
    if (restoreResult.affected === 0) {
      throw new NotFoundException(
        `User with ID ${id} not found or not deleted.`,
      );
    }
    await this.redisService.del(UserService.getCacheKey(id, 'id'));
    await this.redisService.del(UserService.getCacheKey(id, 'admin-details')); // Invalidate admin details cache
    return { message: 'User restored successfully' };
  }

  /**
   * @method updateUserProfilePic
   * @description Uploads and updates a user's profile picture, queuing old picture for deletion.
   * @param {number} userId - The ID of the user whose profile picture is to be updated.
   * @param {Express.Multer.File} profilePic - The new profile picture file.
   * @returns {Promise<ProfilePictureDto>} The updated profile picture URL.
   * @throws {NotFoundException} If the user with the provided ID is not found.
   */
  async updateUserProfilePic(userId: number, profilePic: Express.Multer.File) {
    const user = await this.userRepo.findOneOrFail({
      where: { id: userId },
      select: ['id', 'profilePic'],
      withDeleted: false,
    });
    const objectName = this.objectService.generateUniqueObjectName(
      profilePic.originalname,
    );

    await this.userRepo.update(userId, { profilePic: objectName });

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
    await this.redisService.del(
      UserService.getCacheKey(userId, 'admin-details'),
    ); // Invalidate admin details cache
    return { profilePic: objectName };
  }

  /**
   * @method setProfilePicUrlNull
   * @description Sets a user's profile picture URL to null in the database.
   * @param {number} userId - The ID of the user.
   * @returns {Promise<void>}
   */
  private async setProfilePicUrlNull(userId: number) {
    await this.userRepo.update(userId, { profilePic: undefined });
    await this.redisService.del(UserService.getCacheKey(userId, 'id'));
  }

  /**
   * @method finalizeUser
   * @description Event listener for when a user profile picture upload fails.
   *              Sets the user's profile picture URL to null.
   * @param {FinalizePayloadDto} payload - The payload containing information about the failed upload.
   * @returns {Promise<void>}
   */
  @OnEvent('file.failed.user_picture', { async: true })
  async finalizeUser(payload: FinalizePayloadDto) {
    this.logger.log(
      `Finalizing user profile pic upload for user ID: ${payload.targetId}`,
    );
    await this.setProfilePicUrlNull(payload.targetId);
  }

  /**
   * @method createAddress
   * @description Creates a new address for a specified user.
   * @param {number} userId - The ID of the user for whom to create the address.
   * @param {CreateAddressDto} createAddressDto - The data transfer object containing address creation details.
   * @param {EntityManager} [emGlobal] - Optional global entity manager for transactional consistency.
   * @returns {Promise<AddressDto>} The newly created address data.
   */
  async createAddress(
    userId: number,
    createAddressDto: CreateAddressDto,
    emGlobal?: EntityManager,
  ): Promise<AddressDto> {
    return this.entityManager.transaction(async (emLocal) => {
      const em = emGlobal || emLocal;
      const addressRepo = em.getRepository(Address);
      const existingUser = await em
        .getRepository(User)
        .findOneBy({ id: userId });
      if (!existingUser) {
        throw new NotFoundException(`User with ID ${userId} not found`);
      }
      const address = addressRepo.create({ ...createAddressDto, userId });
      const created = await addressRepo.save(address);
      await this.redisService.del(
        UserService.getCacheKey(userId, 'admin-details'),
      );
      const { id, street, district, city } = created;
      return { id, street, district, city } as AddressDto;
    });
  }

  /**
   * @method getAddresses
   * @description Retrieves all addresses for a specified user.
   * @param {number} userId - The ID of the user whose addresses are to be retrieved.
   * @returns {Promise<AddressDto[]>} An array of address data transfer objects.
   */
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

  /**
   * @method updateAddress
   * @description Updates an existing address for a specified user.
   * @param {number} userId - The ID of the user who owns the address.
   * @param {number} addressId - The ID of the address to update.
   * @param {UpdateAddressDto} updateAddressDto - The data transfer object containing address update details.
   * @returns {Promise<AddressDto>} The updated address data.
   * @throws {NotFoundException} If the address with the provided ID and user ID is not found.
   */
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
    await this.redisService.del(
      UserService.getCacheKey(userId, 'admin-details'),
    ); // Invalidate admin details cache
    const { id, street, district, city } = updatedAdress;
    return { id, street, district, city, userId } as AddressDto;
  }

  /**
   * @method deleteAddress
   * @description Soft deletes an address for a specified user. Prevents deletion if it's the user's only address.
   * @param {number} userId - The ID of the user who owns the address.
   * @param {number} addressId - The ID of the address to delete.
   * @returns {Promise<{ message: string }>} A success message.
   * @throws {BadRequestException} If the user attempts to delete their only address.
   */
  async deleteAddress(
    userId: number,
    addressId: number,
  ): Promise<{ message: string }> {
    const userAddressesCount = await this.addressRepo.count({
      where: { userId },
    });
    if (userAddressesCount <= 1) {
      throw new BadRequestException(
        'Cannot delete the only address associated with the user',
      );
    }
    await this.addressRepo.softDelete(addressId);
    await this.redisService.del(
      UserService.getCacheKey(userId, 'admin-details'),
    ); // Invalidate admin details cache
    return { message: 'Address deleted successfully' };
  }

  /**
   * @method isUserRegistered
   * @description Checks if a user is registered based on their ID.
   * @param {number} userId - The ID of the user to check.
   * @returns {Promise<boolean>} True if the user is registered, false otherwise.
   */
  async isUserRegistered(userId: number): Promise<boolean> {
    const user = await this.userRepo.findOne({
      where: { id: userId },
    });

    return user ? true : false;
  }

  /**
   * @method findUsersByRole
   * @description Finds all users by role
   * @param {UserRole} role - The user role to filter by
   * @returns {Promise<User[]>} Array of users with the specified role
   */
  async findUsersByRole(role: UserRole): Promise<User[]> {
    return this.userRepo.find({
      where: { role },
      select: ['id', 'name', 'phoneNumber', 'role'],
    });
  }

  /**
   * @method getUsersForAdmin
   * @description Retrieves a paginated list of users for admin view, excluding the current user.
   * @param {PaginationQueryDto} paginationQuery - Pagination parameters (page, limit).
   * @param {number} currentUserId - The ID of the current authenticated user to exclude.
   * @returns {Promise<PaginationResponseDto<UserForAdminDto>>} A paginated list of users with admin-specific details.
   */
  async getUsersForAdmin(
    paginationQuery: PaginationQueryDto,
    currentUserId: number,
  ): Promise<PaginationResponseDto<UserForAdminDto>> {
    const { limit, page } = paginationQuery;

    const queryBuilder = this.userRepo
      .createQueryBuilder('user')
      .where('user.id != :currentUserId', { currentUserId })
      .andWhere('user.deletedAt IS NULL')
      .select([
        'user.id',
        'user.name',
        'user.phoneNumber',
        'user.role',
        'user.createdAt',
        'user.blackListedAt',
      ])
      .orderBy('user.createdAt', 'DESC')
      .take(limit)
      .skip((page - 1) * limit);

    const [data, total] = await Promise.all([
      queryBuilder.getMany(),
      queryBuilder.getCount(),
    ]);

    const users: UserForAdminDto[] = data.map((user) => ({
      id: user?.id,
      name: user?.name ?? '',
      phoneNumber: user?.phoneNumber,
      role: user?.role as UserRole,
      isBlacklisted: !!user?.blackListedAt,
    }));

    return {
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
      },
      data: users,
    };
  }
}
