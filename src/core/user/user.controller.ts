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

import { RoleGuard } from '../authentication/guards/role.guard'; // Import RoleGuard
import { Roles } from '../authentication/decorators/role.decorator'; // Import Roles decorator
import { USER_ROLES } from 'src/common/enums/user-role.enum'; // Import USER_ROLES enum
import { UserForAdminDto } from './dtos/response/user-for-admin.dto'; // Import the new DTO
import {
  PaginationQueryDto,
  PaginatedResponse,
  PaginationResponseDto,
} from 'src/common/dtos/pagination.dto'; // Import pagination DTOs
import { UserDetailForAdminDto } from './dtos/response/user-detail-for-admin.dto';

@ApiTags('User')
@ApiBearerAuth()
@ApiBadRequestResponse({ description: 'Bad request' })
@ApiUnauthorizedResponse({ description: 'Unauthorized' })
@ApiTooManyRequestsResponse({
  description: 'Too many requests (Rate limiting)',
})
@ApiInternalServerErrorResponse({ description: 'Internal server error' })
@UseGuards(AccessTokenGuard)
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  /**
   * @method getMe
   * @description Retrieves the profile of the currently authenticated user.
   * @param {number} userId - The ID of the authenticated user.
   * @returns {Promise<GetMeDto>} The user's profile information.
   */
  @Get('/me')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiOkResponse({
    description: 'Successfully fetched user profile',
    type: GetMeDto,
  })
  getMe(@USER('id') userId: number): Promise<GetMeDto> {
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
      limits: { fileSize: 2 * 1024 * 1024 * 5 }, // 2MB
    }),
  )
  async updateProfilePicture(
    @USER('id') userId: number,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<ProfilePictureDto> {
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
  @ApiOperation({ summary: 'Get all users for admin view' })
  @ApiOkResponse({
    description: 'Successfully fetched users for admin view',
    type: PaginatedResponse(UserForAdminDto),
  })
  @UseGuards(RoleGuard)
  @Roles(USER_ROLES.ADMIN)
  getUsersForAdmin(
    @Query() paginationQuery: PaginationQueryDto,
    @USER('id') userId: number,
  ): Promise<PaginationResponseDto<UserForAdminDto>> {
    return this.userService.getUsersForAdmin(paginationQuery, userId);
  }

  /**
   * @method getUserDetailsForAdmin
   * @description Retrieves detailed information for a specific user for administrative purposes.
   * @param {number} userId - The ID of the user to retrieve details for.
   * @returns {Promise<UserDetailForAdminDto>} The detailed user information.
   */
  @Get('/admin/:id')
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

  /**
   * @method deleteUserByAdmin
   * @description Soft-deletes a specific user account by an administrator.
   * @param {number} userId - The ID of the user to delete.
   * @returns {Promise<MessageDto>} A confirmation message.
   */
  @Delete('/admin/user/:id')
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
    return this.userService.deleteUser(userId);
  }
}
