import { Body, Controller, Delete, Get, Put, UseGuards } from '@nestjs/common';
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
} from '@nestjs/swagger';
import { UserService } from './user.service';
import { USER } from '../authentication/decorators/user.decorartor';
import { AccessTokenGuard } from '../authentication/guards/access-token.guard';
import { UpdateUserDto } from './dtos/update-user.dto';

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
}
