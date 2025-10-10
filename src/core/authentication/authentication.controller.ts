import { Body, Controller, Post, Put, UseGuards } from '@nestjs/common';
import { AuthenticationService } from './authentication.service';
import { USER } from './decorators/user.decorartor';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthResponseDto } from './dtos/responses/auth-response.dto';
import { RefreshTokenGuard } from './guards/refresh-token.guard';
import { User } from '../user/entities/user.entity';
import { AuthDto } from './dtos/requests/auth.dto';
import { OtpValidationDto } from './dtos/requests/otp-validation.dto';
import { SendOtpResDto } from './dtos/responses/send-otp-response.dto';
import { UserService } from '../user/user.service';
import { UpdateUserDto } from '../user/dtos/update-user.dto';
import { AccessTokenGuard } from './guards/access-token.guard';

@Controller('authentication')
@ApiBadRequestResponse({ description: 'Bad request' })
@ApiUnauthorizedResponse({ description: 'Unauthorized' })
@ApiTooManyRequestsResponse({
  description: 'Too many requests (Rate limiting)',
})
@ApiInternalServerErrorResponse({ description: 'Internal server error' })
export class AuthenticationController {
  constructor(
    private readonly authenticationService: AuthenticationService,
    private readonly userService: UserService,
  ) {}

  @Post('otp/send')
  @ApiOperation({
    summary: 'send OTP',
    description: 'send sms otp to user',
  })
  @ApiBody({ type: () => AuthDto })
  @ApiOkResponse({
    description: 'return a message it is send',
    type: () => SendOtpResDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request.error in sending',
  })
  async auth(@Body() dto: AuthDto): Promise<SendOtpResDto> {
    return this.authenticationService.sendVerificationCode(dto.phoneNumber);
  }
  @ApiOperation({
    summary: 'validate otp',
    description: 'validate otp for user',
  })
  @ApiOkResponse({
    description: 'Returns user if it is registered esle register him',
    type: () => AuthResponseDto,
  })
  @ApiResponse({
    status: 400,
    description:
      'Bad Request. The request body is invalid or missing required fields.',
  })
  @Post('otp/validate')
  async validateOtp(@Body() dto: OtpValidationDto) {
    return this.authenticationService.validateOtp(dto);
  }

  @UseGuards(AccessTokenGuard)
  @ApiBearerAuth()
  @ApiBody({ type: UpdateUserDto })
  @ApiOperation({
    summary: 'Register user',
    description: 'register user after otp validation if not registered',
  })
  @ApiOkResponse({
    description: 'User successfully registered and updated.',
  })
  @Put('register')
  async updateUserInfos(
    @USER('id') userId: number,
    @Body() dto: UpdateUserDto,
  ) {
    return this.userService.updateUserInfo(dto, userId);
  }

  @UseGuards(RefreshTokenGuard)
  @Post('refresh')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Refresh tokens',
    description:
      'Refreshes access and refresh tokens using a valid refresh token.',
  })
  @ApiOkResponse({
    description: 'Returns the new access token and refresh token.',
    type: () => AuthResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized. Invalid refresh token provided.',
  })
  async refreshTokens(@USER() user: User) {
    return this.authenticationService.issueTokens(user);
  }
}
