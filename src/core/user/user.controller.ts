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
  })
  getMe(@USER('id') userId: number) {
    return this.userService.findById(userId);
  }

  @Put('/me')
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiOkResponse({
    description: 'User profile updated successfully',
  })
  @ApiBody({ type: UpdateUserDto })
  updateUserInfos(@USER('id') userId: number, @Body() userDto: UpdateUserDto) {
    return this.userService.updateUserInfo(userDto, userId);
  }

  @Delete('/me')
  @ApiOperation({ summary: 'Delete current user account' })
  @ApiOkResponse({ description: 'User deleted successfully' })
  deleteUser(@USER('id') userId: number): Promise<{ message: string }> {
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
  @UseInterceptors(
    FileInterceptor('picture', {
      storage: memoryStorage(),
      limits: { fileSize: 2 * 1024 * 1024 * 5 }, // 2MB
    }),
  )
  async updateProfilePicture(
    @USER('id') userId: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.userService.updateUserProfilePic(userId, file);
  }

  @Post('/address')
  @ApiOperation({ summary: 'Create a new address for the current user' })
  @ApiOkResponse({
    description: 'Address created successfully',
  })
  createAddress(
    @USER('id') userId: number,
    @Body() createAddressDto: CreateAddressDto,
  ) {
    return this.userService.createAddress(userId, createAddressDto);
  }

  @Get('/address')
  @ApiOperation({ summary: 'Get all addresses for the current user' })
  @ApiOkResponse({
    description: 'Successfully fetched user addresses',
  })
  getAddresses(@USER('id') userId: number) {
    return this.userService.getAddresses(userId);
  }

  @Put('/address/:id')
  @ApiOperation({ summary: 'Update an address for the current user' })
  @ApiOkResponse({
    description: 'Address updated successfully',
  })
  updateAddress(
    @USER('id') userId: number,
    @Param('id') addressId: number,
    @Body() updateAddressDto: CreateAddressDto,
  ) {
    return this.userService.updateAddress(userId, addressId, updateAddressDto);
  }

  @Delete('/address/:id')
  @ApiOperation({ summary: 'Delete an address for the current user' })
  @ApiOkResponse({
    description: 'Address deleted successfully',
  })
  deleteAddress(@USER('id') userId: number, @Param('id') addressId: number) {
    return this.userService.deleteAddress(userId, addressId);
  }
}
