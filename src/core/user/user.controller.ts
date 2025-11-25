import {
  Body,
  Controller,
  Delete,
  Get,
  Put,
  Patch,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  HttpCode,
  HttpStatus,
  Post,
  Param,
  Query,
  ParseIntPipe,
  Logger,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiTooManyRequestsResponse,
  ApiInternalServerErrorResponse,
  ApiTags,
  ApiOkResponse,
  ApiBody,
  ApiConsumes,
  ApiQuery,
} from '@nestjs/swagger';
import { UserService } from './user.service';
import { USER } from '../authentication/decorators/user.decorartor';
import { AccessTokenGuard } from '../authentication/guards/access-token.guard';
import { UpdateUserDto } from './dtos/update-user.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { CreateAddressDto } from './dtos/create-address.dto';
import { GetMeDto } from './dtos/response/get-me.dto';
import { UserDto } from './dtos/response/user.dto';
import { MessageDto } from './dtos/response/message.dto';
import { ProfilePictureDto } from './dtos/response/profile-picture.dto';
import { AddressDto } from './dtos/response/address.dto';
import { UpdateAddressDto } from './dtos/update-address.dto';
import { RoleGuard } from '../authentication/guards/role.guard';
import { Roles } from '../authentication/decorators/role.decorator';
import { USER_ROLES } from 'src/common/enums/user-role.enum';
import { UserForAdminDto } from './dtos/response/user-for-admin.dto';
import {
  PaginationQueryDto,
  PaginatedResponse,
  PaginationResponseDto,
} from 'src/common/dtos/pagination.dto';
import { UserDetailForAdminDto } from './dtos/response/user-detail-for-admin.dto';
import { BulkDeleteUserDto } from './dtos/bulk-delete.dto';
import { PresignedUrlInterceptor } from 'src/common/interceptors/presigned-url.interceptor';
import { ConvertToPresignedUrls } from 'src/common/decorators/convert-to-presigned-urls.decorator';
import { BUCKET_TARGETS } from 'src/common/constants/buckets';

@ApiTags('User')
@ApiBearerAuth()
@ApiBadRequestResponse({ description: 'Bad request' })
@ApiUnauthorizedResponse({ description: 'Unauthorized' })
@ApiTooManyRequestsResponse({
  description: 'Too many requests (Rate limiting)',
})
@ApiInternalServerErrorResponse({ description: 'Internal server error' })
@UseInterceptors(PresignedUrlInterceptor)
@Controller('user')
@UseGuards(AccessTokenGuard)
export class UserController {
  private readonly logger = new Logger(UserController.name);

  constructor(private readonly userService: UserService) {}

  /**
   * @method getMe
   * @description Retrieves the profile of the currently authenticated user.
   * @param {number} userId - The ID of the authenticated user.
   * @returns {Promise<GetMeDto>} The user's profile information.
   */
  @Get('/me')
  @ConvertToPresignedUrls(['avatar'], BUCKET_TARGETS.USER_PROFILE)
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiOkResponse({
    description: 'Successfully fetched user profile',
    type: GetMeDto,
  })
  getMe(@USER('id') userId: number): Promise<GetMeDto> {
    this.logger.log(`Fetching profile for user ID: ${userId}`);
    return this.userService.findById(userId);
  }

  /**
   * @method updateUserInfos
   * @description Updates the profile information of the currently authenticated user.
   * @param {number} userId - The ID of the authenticated user.
   * @param {UpdateUserDto} userDto - The data to update the user's profile with.
   * @returns {Promise<UserDto>} The updated user's profile information.
   */
  @Put('/me')
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiOkResponse({
    description: 'User profile updated successfully',
    type: UserDto,
  })
  @ApiBody({ type: UpdateUserDto })
  updateUserInfos(
    @USER('id') userId: number,
    @Body() userDto: UpdateUserDto,
  ): Promise<UserDto> {
    this.logger.log(`Updating profile for user ID: ${userId}`);
    return this.userService.updateUser(userId, userDto);
  }

  /**
   * @method deleteUser
   * @description Soft-deletes the account of the currently authenticated user.
   * @param {number} userId - The ID of the authenticated user.
   * @returns {Promise<MessageDto>} A confirmation message.
   */
  @Delete('/me')
  @ApiOperation({ summary: 'Delete current user account' })
  @ApiOkResponse({
    description: 'User deleted successfully',
    type: MessageDto,
  })
  deleteUser(@USER('id') userId: number): Promise<MessageDto> {
    this.logger.log(`User requesting account deletion, ID: ${userId}`);
    return this.userService.deleteUser(userId);
  }

  /**
   * @method updateProfilePicture
   * @description Uploads and sets a new profile picture for the current user.
   * @param {number} userId - The ID of the authenticated user.
   * @param {Express.Multer.File} file - The new profile picture file.
   * @returns {Promise<ProfilePictureDto>} The URL of the updated profile picture.
   */
  @Patch('/me/picture')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Upload and set new profile picture' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        picture: {
          type: 'string',
          format: 'binary',
          description: 'New profile picture file (max 2MB).',
        },
      },
      required: ['picture'],
    },
  })
  @ApiOkResponse({
    description: 'Profile picture updated successfully',
    type: ProfilePictureDto,
  })
  @UseInterceptors(
    FileInterceptor('picture', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    }),
  )
  @ConvertToPresignedUrls(['profilePic'], BUCKET_TARGETS.USER_PROFILE)
  async updateProfilePicture(
    @USER('id') userId: number,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }),
          new FileTypeValidator({ fileType: '.(png|jpeg|jpg)' }),
        ],
        fileIsRequired: true,
      }),
    )
    file: Express.Multer.File,
  ): Promise<ProfilePictureDto> {
    this.logger.log(`Updating profile picture for user ID: ${userId}`);
    return this.userService.updateUserProfilePic(userId, file);
  }

  /**
   * @method createAddress
   * @description Creates a new address for the currently authenticated user.
   * @param {number} userId - The ID of the authenticated user.
   * @param {CreateAddressDto} createAddressDto - The data for the new address.
   * @returns {Promise<AddressDto>} The newly created address.
   */
  @Post('/address')
  @ApiOperation({ summary: 'Create a new address for the current user' })
  @ApiOkResponse({
    description: 'Address created successfully',
    type: AddressDto,
  })
  createAddress(
    @USER('id') userId: number,
    @Body() createAddressDto: CreateAddressDto,
  ): Promise<AddressDto> {
    this.logger.log(`Creating address for user ID: ${userId}`);
    return this.userService.createAddress(userId, createAddressDto);
  }

  /**
   * @method getAddresses
   * @description Retrieves all addresses associated with the current user.
   * @param {number} userId - The ID of the authenticated user.
   * @returns {Promise<AddressDto[]>} A list of the user's addresses.
   */
  @Get('/address')
  @ApiOperation({ summary: 'Get all addresses for the current user' })
  @ApiOkResponse({
    description: 'Successfully fetched user addresses',
    type: [AddressDto],
  })
  getAddresses(@USER('id') userId: number): Promise<AddressDto[]> {
    return this.userService.getAddresses(userId);
  }

  /**
   * @method updateAddress
   * @description Updates an existing address for the current user.
   * @param {number} userId - The ID of the authenticated user.
   * @param {number} addressId - The ID of the address to update.
   * @param {UpdateAddressDto} updateAddressDto - The data to update the address with.
   * @returns {Promise<AddressDto>} The updated address.
   */
  @Put('/address/:id')
  @ApiOperation({ summary: 'Update an address for the current user' })
  @ApiOkResponse({
    description: 'Address updated successfully',
    type: AddressDto,
  })
  updateAddress(
    @USER('id') userId: number,
    @Param('id') addressId: number,
    @Body() updateAddressDto: UpdateAddressDto,
  ): Promise<AddressDto> {
    this.logger.log(`Updating address ${addressId} for user ID: ${userId}`);
    return this.userService.updateAddress(userId, addressId, updateAddressDto);
  }

  /**
   * @method deleteAddress
   * @description Deletes an address for the current user.
   * @param {number} userId - The ID of the authenticated user.
   * @param {number} addressId - The ID of the address to delete.
   * @returns {Promise<MessageDto>} A confirmation message.
   */
  @Delete('/address/:id')
  @ApiOperation({ summary: 'Delete an address for the current user' })
  @ApiOkResponse({
    description: 'Address deleted successfully',
    type: MessageDto,
  })
  deleteAddress(
    @USER('id') userId: number,
    @Param('id') addressId: number,
  ): Promise<MessageDto> {
    this.logger.log(`Deleting address ${addressId} for user ID: ${userId}`);
    return this.userService.deleteAddress(userId, addressId);
  }

  /**
   * @method getUsersForAdmin
   * @description Retrieves a paginated list of all users for administrative purposes.
   * @param {PaginationQueryDto} paginationQuery - Pagination and filtering parameters.
   * @param {number} userId - The ID of the authenticated admin user.
   * @returns {Promise<PaginationResponseDto<UserForAdminDto>>} A paginated list of users.
   */
  @Get('/admin/all')
  @ConvertToPresignedUrls(['avatar'], BUCKET_TARGETS.USER_PROFILE)
  @ApiOperation({ summary: 'Get all users for admin view' })
  @ApiOkResponse({
    description: 'Successfully fetched users for admin view',
    type: PaginatedResponse(UserForAdminDto),
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search term for filtering users',
  })
  @UseGuards(RoleGuard)
  @Roles(USER_ROLES.ADMIN)
  getUsersForAdmin(
    @Query() paginationQuery: PaginationQueryDto,
    @USER('id') userId: number,
    @Query('search') search?: string,
  ): Promise<PaginationResponseDto<UserForAdminDto>> {
    this.logger.log(`Admin ${userId} fetching all users`);
    return this.userService.getUsersForAdmin(paginationQuery, userId, search);
  }

  /**
   * @method getUserDetailsForAdmin
   * @description Retrieves detailed information for a specific user for administrative purposes.
   * @param {number} userId - The ID of the user to retrieve details for.
   * @returns {Promise<UserDetailForAdminDto>} The detailed user information.
   */
  @Get('/admin/:id')
  @ConvertToPresignedUrls(['avatar'], BUCKET_TARGETS.USER_PROFILE)
  @ApiOperation({ summary: 'Get user details for admin view' })
  @ApiOkResponse({
    description: 'Successfully fetched user details for admin view',
    type: UserDetailForAdminDto,
  })
  @UseGuards(AccessTokenGuard, RoleGuard)
  @Roles(USER_ROLES.ADMIN)
  getUserDetailsForAdmin(
    @Param('id', ParseIntPipe) userId: number,
  ): Promise<UserDetailForAdminDto> {
    return this.userService.getUserDetailsForAdmin(userId);
  }

  // ... (inside UserController class)

  /**
   * @method deleteBulkUsersByAdmin
   * @description Soft-deletes multiple user accounts by an administrator.
   * @param {BulkDeleteUserDto} dto - The DTO containing the user IDs to delete.
   * @param {number} currentAdminId - The ID of the admin performing the action.
   * @returns {Promise<MessageDto>} A confirmation message.
   */
  @Delete('/admin/bulk')
  @ApiOperation({ summary: 'Bulk delete users by admin' })
  @ApiOkResponse({
    description: 'Successfully initiated bulk deletion of users.',
    type: MessageDto,
  })
  @UseGuards(RoleGuard)
  @Roles(USER_ROLES.ADMIN)
  deleteBulkUsersByAdmin(
    @Query() dto: BulkDeleteUserDto,
    @USER('id') currentAdminId: number,
  ): Promise<MessageDto> {
    this.logger.log(
      `Admin ${currentAdminId} initiating bulk delete of users: ${dto.userIds.join(', ')}`,
    );
    return this.userService.deleteBulk(dto.userIds, currentAdminId);
  }

  /**
   * @method deleteUserByAdmin
   * @description Soft-deletes a specific user account by an administrator.
   * @param {number} userId - The ID of the user to delete.
   * @returns {Promise<MessageDto>} A confirmation message.
   */
  @Delete('/admin/:id')
  @ApiOperation({ summary: 'Delete user by admin' })
  @ApiOkResponse({
    description: 'Successfully delete user for admin',
    type: MessageDto,
  })
  @UseGuards(AccessTokenGuard, RoleGuard)
  @Roles(USER_ROLES.ADMIN)
  deleteUserByAdmin(
    @Param('id', ParseIntPipe) userId: number,
  ): Promise<MessageDto> {
    this.logger.log(`Admin deleting user ID: ${userId}`);
    return this.userService.deleteUser(userId);
  }
}
