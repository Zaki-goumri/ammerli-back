import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Put,
  UseGuards,
  Logger,
} from '@nestjs/common';
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
  ApiTags,
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
import { Throttle } from '@nestjs/throttler';
import { SendOtpDto } from './dtos/response/send-otp.dto';
import { ValidateOtpDto } from './dtos/response/validate-otp.dto';
import { AuthResDto } from './dtos/response/refresh-token.dto';
import { FirebaseTokenDto } from './dtos/requests/firebase-token.dto';
import { LogoutDto } from './dtos/requests/logout.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { MessageDto } from '../user/dtos/response/message.dto';

@ApiTags('Authentication')
@Controller('authentication')
@ApiBadRequestResponse({ description: 'Bad request' })
@ApiUnauthorizedResponse({ description: 'Unauthorized' })
@ApiTooManyRequestsResponse({
  description: 'Too many requests (Rate limiting)',
})
@ApiInternalServerErrorResponse({ description: 'Internal server error' })
export class AuthenticationController {
  private readonly logger = new Logger(AuthenticationController.name);

  constructor(
    private readonly authenticationService: AuthenticationService,
    private readonly notificationsService: NotificationsService,
  ) {}
  /**
   * @method auth
   * @description Sends an OTP to the provided phone number for user authentication.
   * Rate limited to 1 request per 30 seconds to prevent abuse.
   * @param {AuthDto} dto - The authentication data containing the phone number.
   * @returns {Promise<SendOtpDto>} A message indicating that the OTP has been sent.
   */

  @Throttle({
    default: {
      limit: 1,
      ttl: 30000,
    },
  })
  @Post('otp/send')
  @ApiOperation({
    summary: 'send OTP',
    description:
      'Send SMS OTP to user. Rate limited to 1 request per 30 seconds.',
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
  @ApiResponse({
    status: 429,
    description:
      'Too Many Requests. Please wait 30 seconds before requesting a new OTP.',
  })
  async auth(@Body() dto: AuthDto): Promise<SendOtpDto> {
    this.logger.log(`Requesting OTP for phone number: ${dto.phoneNumber}`);
    return this.authenticationService.sendVerificationCode(dto.phoneNumber);
  }

  /**
   * @method validateOtp
   * @description Validates the provided OTP and either registers a new user or logs in an existing one.
   * @param {OtpValidationDto} dto - The OTP validation data.
   * @returns {Promise<ValidateOtpDto>} Authentication tokens and user registration status.
   */
  @ApiOperation({
    summary: 'validate otp',
    description: 'validate otp for user',
  })
  @HttpCode(HttpStatus.OK)
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
    this.logger.log(`Validating OTP for phone number: ${dto.phoneNumber}`);
    return this.authenticationService.validateOtp(dto);
  }

  /**
   * @method validateFirebaseToken
   * @description Validates a Firebase ID token and authenticates the user.
   * @param {FirebaseTokenDto} dto - The DTO containing the Firebase ID token.
   * @returns {Promise<ValidateOtpDto>} Authentication tokens and user registration status.
   */
  @Post('firebase/validate')
  @ApiOperation({
    summary: 'Validate Firebase ID token',
    description: 'Authenticates user using a Firebase ID token.',
  })
  @ApiBody({ type: () => FirebaseTokenDto })
  @ApiOkResponse({
    description: 'User authenticated successfully with Firebase token.',
    type: () => ValidateOtpDto,
  })
  async validateFirebaseToken(
    @Body() dto: FirebaseTokenDto,
  ): Promise<ValidateOtpDto> {
    this.logger.log('Validating Firebase token');
    return this.authenticationService.validateFirebaseToken(dto.firebaseToken);
  }

  /**
   * @method registerUser
   * @description Registers or updates user information after OTP validation.
   * @param {string} phoneNumber - The phone number of the authenticated user from the token.
   * @param {RegisterUserDto} dto - The user registration data.
   * @returns {Promise<ValidateOtpDto>} Authentication tokens and user registration status.
   */
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
  async registerUser(
    @USER('phoneNumber') phoneNumber: string,
    @Body() dto: RegisterUserDto,
  ): Promise<ValidateOtpDto> {
    this.logger.log(`Registering user with phone number: ${phoneNumber}`);
    return this.authenticationService.registerUser(dto, phoneNumber);
  }

  /**
   * @method refreshTokens
   * @description Refreshes access and refresh tokens using a valid refresh token.
   * @param {User} user - The user object obtained from the refresh token.
   * @returns {Promise<AuthResDto>} New access and refresh tokens.
   */
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
    this.logger.log(`Refreshing tokens for user ID: ${user.id}`);
    return this.authenticationService.issueTokens(user);
  }

  /**
   * @method logout
   * @description Logs out the user by removing their FCM token(s).
   * If fcmToken is provided, removes only that device.
   * If fcmToken is not provided, removes all devices (logout from all).
   * @param {LogoutDto} dto -  DTO containing fcmToken to remove.
   * @returns {Promise<MessageDto>} Success message.
   */
  @Post('logout')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Logout user',
    description:
      'Logs out the user by removing their FCM token(s). ' +
      'If fcmToken is provided in body, removes only that device. ' +
      'If no fcmToken is provided, logs out from all devices.',
  })
  @ApiOkResponse({
    description: 'Successfully logged out.',
    schema: {
      example: { message: 'Logged out from device successfully' },
    },
  })
  @ApiBody({ type: LogoutDto })
  async logout(@Body() dto: LogoutDto): Promise<MessageDto> {
    this.logger.log(`Logging out user`);
    await this.notificationsService.deleteToken(dto.fcmToken);
    return { message: 'Logged out from device successfully' };
  }
}
