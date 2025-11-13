import {
  ForbiddenException,
  Injectable,
  Logger,
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import authConfig from 'src/config/auth.config';
import { User } from '../user/entities/user.entity';
import { UserService } from '../user/user.service';
import { OtpValidationDto } from './dtos/requests/otp-validation.dto';
import { RegisterUserDto } from './dtos/requests/register-user.dto';
import { AuthResDto } from './dtos/response/refresh-token.dto';
import { SendOtpDto } from './dtos/response/send-otp.dto';
import { ValidateOtpDto } from './dtos/response/validate-otp.dto';
import { BlackListService } from '../user/black-list/black-list.service';
import { FirebaseService } from 'src/infrastructure/firebase/firebase.service';
import { transformPhoneNumber } from 'src/common/utils/authentication/phone-number.utils';
import { RegistrationTokenPayload } from './interfaces/access-token-payload.interface';
import { UserDto } from '../user/dtos/response/user.dto';
import { plainToInstance } from 'class-transformer';
import { OtpStrategy } from './strategies/otp/otp.strategy';

/**
 * @class AuthenticationService
 * @description Handles user authentication, including OTP validation and token issuance.
 * @property {Logger} logger - The logger instance for this service.
 */
@Injectable()
export class AuthenticationService {
  logger = new Logger(AuthenticationService.name);
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly firebaseService: FirebaseService,
    private readonly blackListService: BlackListService,
    private readonly otpStrategy: OtpStrategy,
  ) {}

  /**
   * @method validateOtp
   * @description Validates the provided OTP for a given phone number using the injected OTP strategy.
   * @param {OtpValidationDto} dto - The OTP validation data.
   * @returns {Promise<ValidateOtpDto>} An object containing authentication tokens and a flag indicating if the user is registered.
   * @throws {UnauthorizedException} If the OTP is invalid or expired.
   */
  async validateOtp(dto: OtpValidationDto): Promise<ValidateOtpDto> {
    const { phoneNumber, otp } = dto;

    await this.checkBlacklistAndThrow(phoneNumber);

    const isValid = await this.otpStrategy.verify(phoneNumber, otp);
    if (!isValid) {
      throw new UnauthorizedException('Invalid or expired OTP');
    }

    const user =
      await this.userService.findByPhoneNumberWithoutException(phoneNumber);
    if (!user) {
      const registrationToken = await this.issueRegistrationToken(phoneNumber);
      return {
        accessToken: registrationToken,
        isRegistered: false,
        user: null,
        refreshToken: null,
      };
    }
    const tokens = await this.issueTokens(user);

    return {
      user: tokens.user,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      isRegistered: !!user.isRegistered,
    };
  }

  async validateFirebaseToken(firebaseToken: string): Promise<ValidateOtpDto> {
    const decodedToken =
      await this.firebaseService.verifyIdToken(firebaseToken);
    if (!decodedToken.phone_number)
      throw new UnauthorizedException(
        'Firebase token does not contain a phone number',
      );

    const phoneNumber = transformPhoneNumber(decodedToken.phone_number);
    await this.checkBlacklistAndThrow(phoneNumber);
    const user =
      await this.userService.findByPhoneNumberWithoutException(phoneNumber);

    if (!user) {
      const registrationToken = await this.issueRegistrationToken(phoneNumber);
      return {
        accessToken: registrationToken,
        isRegistered: false,
        refreshToken: null,
        user: null,
      };
    }
    const tokens = await this.issueTokens(user);

    return {
      user: tokens.user,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      isRegistered: !!user.isRegistered,
    };
  }

  /**
   * @method checkBlacklistAndThrow
   * @description Checks if a phone number is blacklisted and throws a ForbiddenException if it is.
   * @param {string} phoneNumber - The phone number to check.
   * @throws {ForbiddenException} If the phone number is blacklisted.
   */
  private async checkBlacklistAndThrow(phoneNumber: string): Promise<void> {
    const isBlacklisted =
      await this.blackListService.isPhoneNumberBlacklisted(phoneNumber);
    if (isBlacklisted) {
      throw new ForbiddenException('This phone number is blacklisted.');
    }
  }

  /**
   * @method issueTokens
   * @description Issues new access and refresh tokens for a user.
   * @param {User} user - The user to issue tokens for.
   * @returns {Promise<AuthResDto>} An object containing the new tokens and user information.
   * @throws {Error} If token issuance fails.
   */
  async issueTokens(user: User): Promise<AuthResDto> {
    try {
      const { id, phoneNumber, role, isRegistered } = user;
      const accessTokenPayload = {
        id,
        phoneNumber,
        role,
        isRegistered,
      };
      const refreshTokenPayload = {
        id,
        phoneNumber,
        role,
      };

      const jwtConfig = authConfig().jwt;

      const [accessToken, refreshToken] = await Promise.all([
        this.jwtService.signAsync(accessTokenPayload, {
          expiresIn: jwtConfig.accessTokenExpiresIn,
          secret: jwtConfig.accessTokenSecret,
        }),
        this.jwtService.signAsync(refreshTokenPayload, {
          expiresIn: jwtConfig.refreshTokenExpiresIn,
          secret: jwtConfig.refreshTokenSecret,
        }),
      ]);

      return {
        accessToken,
        refreshToken,
        user: plainToInstance(UserDto, user),
      };
    } catch (error) {
      this.logger.error('Error issuing tokens', error);
      throw new InternalServerErrorException('Failed to issue tokens');
    }
  }

  /**
   * @method sendVerificationCode
   * @description Sends a verification code (OTP) to the user's phone number using the injected OTP strategy.
   * @param {string} phoneNumber - The phone number to send the OTP to.
   * @returns {Promise<{ message: string }>} A confirmation message.
   */
  async sendVerificationCode(phoneNumber: string): Promise<SendOtpDto> {
    await this.checkBlacklistAndThrow(phoneNumber);
    await this.otpStrategy.send(phoneNumber);
    return { message: `OTP sent to ${phoneNumber}` };
  }

  private async issueRegistrationToken(phoneNumber: string): Promise<string> {
    const payload: RegistrationTokenPayload = {
      phoneNumber,
      purpose: 'registration',
    };
    const jwtConfig = authConfig().jwt;
    return this.jwtService.signAsync(payload, {
      expiresIn: '15m', // Short-lived token
      secret: jwtConfig.accessTokenSecret,
    });
  }

  async registerUser(
    dto: RegisterUserDto,
    phoneNumber: string,
  ): Promise<ValidateOtpDto> {
    const user = await this.userService.create({ ...dto, phoneNumber });
    const tokens = await this.issueTokens(user);
    return { ...tokens, isRegistered: true };
  }
}