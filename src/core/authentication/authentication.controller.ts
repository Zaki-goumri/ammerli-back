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
import { RefreshTokenGuard } from './guards/refresh-token.guard';
import { User } from '../user/entities/user.entity';
import { AuthDto } from './dtos/requests/auth.dto';
import { OtpValidationDto } from './dtos/requests/otp-validation.dto';
import { AccessTokenGuard } from './guards/access-token.guard';
import { RegisterUserDto } from './dtos/requests/register-user.dto';
import { SkipRegistrationCheck } from './decorators/skip-registration-check.decorator';
import { SendOtpDto } from './dtos/response/send-otp.dto';
import { ValidateOtpDto } from './dtos/response/validate-otp.dto';
import { AuthResDto } from './dtos/response/refresh-token.dto';

@Controller('authentication')
@ApiBadRequestResponse({ description: 'Bad request' })
@ApiUnauthorizedResponse({ description: 'Unauthorized' })
@ApiTooManyRequestsResponse({
  description: 'Too many requests (Rate limiting)',
})
@ApiInternalServerErrorResponse({ description: 'Internal server error' })
export class AuthenticationController {
  constructor(private readonly authenticationService: AuthenticationService) {}
  //TODO: add rate limiting
  @Post('otp/send')
  @ApiOperation({
    summary: 'send OTP',
    description: 'send sms otp to user',
  })
  @ApiBody({ type: () => AuthDto })
  @ApiOkResponse({
    description: 'return a message it is send',
    type: () => SendOtpDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request.error in sending',
  })
  async auth(@Body() dto: AuthDto): Promise<SendOtpDto> {
    return this.authenticationService.sendVerificationCode(dto.phoneNumber);
  }
  @ApiOperation({
    summary: 'validate otp',
    description: 'validate otp for user',
  })
  @ApiOkResponse({
    description: 'Returns user if it is registered esle register him',
    type: () => ValidateOtpDto,
  })
  @ApiResponse({
    status: 400,
    description:
      'Bad Request. The request body is invalid or missing required fields.',
  })
  @Post('otp/validate')
  async validateOtp(@Body() dto: OtpValidationDto): Promise<ValidateOtpDto> {
    return this.authenticationService.validateOtp(dto);
  }

  @UseGuards(AccessTokenGuard)
  @SkipRegistrationCheck()
  @ApiBearerAuth()
  @ApiBody({ type: RegisterUserDto })
  @ApiOperation({
    summary: 'Register user',
    description: 'register user after otp validation if not registered',
  })
  @ApiOkResponse({
    description: 'User successfully registered and updated.',
    type: () => ValidateOtpDto,
  })
  @Put('register')
  async updateUserInfos(
    @USER('id') userId: number,
    @Body() dto: RegisterUserDto,
  ): Promise<ValidateOtpDto> {
    return this.authenticationService.registerUser(dto, userId);
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
    type: () => AuthResDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized. Invalid refresh token provided.',
  })
  async refreshTokens(@USER() user: User): Promise<AuthResDto> {
    return this.authenticationService.issueTokens(user);
  }
}
