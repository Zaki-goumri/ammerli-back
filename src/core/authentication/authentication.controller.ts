import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthenticationService } from './authentication.service';
import { USER } from './decorators/user.decorartor';
import {
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { AuthResponseDto } from './dtos/responses/auth-response.dto';
import { RefreshTokenGuard } from './guards/refresh-token.guard';
import { User } from '../user/entities/user.entity';
import { AuthDto } from './dtos/requests/auth.dto';
import { OtpValidationDto } from './dtos/requests/otp-validation.dto';
import { SendOtpResDto } from './dtos/responses/send-otp-response.dto';

@Controller('authentication')
export class AuthenticationController {
  constructor(private readonly authenticationService: AuthenticationService) {}

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
    return this.authenticationService.sendVerificationCode(dto.phone);
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
  @UseGuards(RefreshTokenGuard)
  @Post('refresh')
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

  @Post('forgot-password')
  @ApiOperation({
    summary: 'Forgot password',
    description: 'Sends a password reset email to the user.',
  })
  @ApiOkResponse({
    description: 'Returns a message indicating that the email has been sent.',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found.',
  })
  async forgotPassword(@Body('phone') phone: string) {
    return this.authenticationService.forgotPassword(phone);
  }

  @Post('reset-password')
  @ApiOperation({
    summary: 'Reset password',
    description: "Resets the user's password with the provided token.",
  })
  @ApiOkResponse({
    description:
      'Returns a message indicating that the password has been reset.',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid reset token.',
  })
  async resetPassword(
    @Body('token') token: string,
    @Body('password') password: string,
  ) {
    return this.authenticationService.resetPassword(token, password);
  }
}
