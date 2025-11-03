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

  @Get('/me')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiOkResponse({
    description: 'Successfully fetched user profile',
    type: GetMeDto,
  })
  getMe(@USER('id') userId: number): Promise<GetMeDto> {
    return this.userService.findById(userId);
  }

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

  @Delete('/me')
  @ApiOperation({ summary: 'Delete current user account' })
  @ApiOkResponse({
    description: 'User deleted successfully',
    type: MessageDto,
  })
  deleteUser(@USER('id') userId: number): Promise<MessageDto> {
    return this.userService.deleteUser(userId);
  }

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

  @Get('/address')
  @ApiOperation({ summary: 'Get all addresses for the current user' })
  @ApiOkResponse({
    description: 'Successfully fetched user addresses',
    type: [AddressDto],
  })
  getAddresses(@USER('id') userId: number): Promise<AddressDto[]> {
    return this.userService.getAddresses(userId);
  }

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

  @Get('/admin/all')
  @ApiOperation({ summary: 'Get all users for admin view' })
  @ApiOkResponse({
    description: 'Successfully fetched users for admin view',
    type: PaginatedResponse(UserForAdminDto),
  })
  @UseGuards(AccessTokenGuard, RoleGuard)
  @Roles(USER_ROLES.ADMIN)
  getUsersForAdmin(
    @Query() paginationQuery: PaginationQueryDto,
    @USER('id') userId: number,
  ): Promise<PaginationResponseDto<UserForAdminDto>> {
    return this.userService.getUsersForAdmin(paginationQuery, userId);
  }
}
