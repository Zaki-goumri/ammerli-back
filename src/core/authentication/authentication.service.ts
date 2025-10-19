import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { AuthResponseDto } from './dtos/responses/auth-response.dto';
import { JwtService } from '@nestjs/jwt';
import { RedisService } from 'nestjs-redis-client';
import authConfig from 'src/config/auth.config';
import { UserService } from '../user/user.service';
import { User } from '../user/entities/user.entity';
import { OtpValidationDto } from './dtos/requests/otp-validation.dto';
import { UpdateUserDto } from '../user/dtos/update-user.dto';
import { thru } from 'lodash';
import { RegisterUserDto } from './dtos/requests/register-user.dto';

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
    private readonly redisService: RedisService,
  ) {}

  /**
   * @constant {string} CACHE_KEY_PREFIX
   * @description The prefix for OTP-related cache keys in Redis.
   */
  static CACHE_KEY_PREFIX = 'otp';

  /**
   * @method getCacheKey
   * @description Generates a cache key for storing OTPs.
   * @param {string} key - The phone number to use in the cache key.
   * @returns {string} The generated cache key.
   */
  static getCacheKey(key: string): string {
    return `${this.CACHE_KEY_PREFIX}:${key}`;
  }

  /**
   * @method validateOtp
   * @description Validates the provided OTP for a given phone number. If valid, it either creates a new user or logs in an existing user.
   * @param {OtpValidationDto} dto - The OTP validation data.
   * @returns {Promise<AuthResponseDto & { isRegistered: boolean }>} An object containing authentication tokens and a flag indicating if the user is registered.
   * @throws {UnauthorizedException} If the OTP is invalid or expired.
   */
  async validateOtp(
    dto: OtpValidationDto,
  ): Promise<AuthResponseDto & { isRegistered: boolean }> {
    const { phoneNumber, otp } = dto;
    const cachedOtp = await this.redisService.get<string>(
      AuthenticationService.getCacheKey(phoneNumber),
    );
    if (!cachedOtp || cachedOtp !== otp) {
      throw new UnauthorizedException('Invalid or expired OTP');
    }
    //await this.redisService.del(AuthenticationService.getCacheKey(phoneNumber));

    const user =
      await this.userService.findByPhoneNumberWithoutException(phoneNumber);
    if (!user) {
      const newUser = await this.userService.create({ phoneNumber });
      const tokens = await this.issueTokens(newUser);
      return { ...tokens, isRegistered: false };
    }

    const isRegistered = this.validateFields(user);
    const tokens = await this.issueTokens(user);
    return { ...tokens, isRegistered };
  }

  /**
   * @method validateFields
   * @description Validates that all required fields for a user are present.
   * @param {User} user - The user object to validate.
   * @returns {boolean} `true` if all required fields are present, otherwise `false`.
   */
  private validateFields(user: User): boolean {
    if (!user) return false;
    const nullableKeys = ['profilePic', 'deletedAt', 'updatedAt', 'createdAt'];
    for (const [key, value] of Object.entries(user)) {
      if (nullableKeys.includes(key)) continue;
      if (value === null || value === undefined) {
        return false;
      }
    }
    return true;
  }

  /**
   * @method issueTokens
   * @description Issues new access and refresh tokens for a user.
   * @param {User} user - The user to issue tokens for.
   * @returns {Promise<AuthResponseDto>} An object containing the new tokens and user information.
   * @throws {Error} If token issuance fails.
   */
  async issueTokens(user: User): Promise<AuthResponseDto> {
    try {
      const { id, phoneNumber, role } = user;
      const accessTokenPayload = { id, phoneNumber, role };
      const refreshTokenPayload = {
        sub: id,
        phoneNumber,
        role,
        type: 'refresh',
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
        user: user,
      };
    } catch (error) {
      this.logger.error('Error issuing tokens', error);
      throw new Error('Failed to issue tokens');
    }
  }

  /**
   * @method generateAndSetOtp
   * @description Generates a random OTP and stores it in Redis.
   * @param {string} phoneNumber - The phone number to associate with the OTP.
   * @returns {Promise<string>} The generated OTP.
   */
  private async generateAndSetOtp(phoneNumber: string): Promise<string> {
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    await this.redisService.set(
      AuthenticationService.getCacheKey(phoneNumber),
      otp,
      600,
    );
    return otp;
  }

  /**
   * @method sendVerificationCode
   * @description Sends a verification code (OTP) to the user's phone number.
   * @param {string} phoneNumber - The phone number to send the OTP to.
   * @returns {Promise<{ message: string }>} A confirmation message.
   */
  async sendVerificationCode(
    phoneNumber: string,
  ): Promise<{ message: string }> {
    const otp = await this.generateAndSetOtp(phoneNumber);
    //TODO: Send sms with OTP
    this.logger.log(`OTP for ${phoneNumber}: ${otp}`);
    return { message: `OTP sent to ${phoneNumber}` };
  }

  async registerUser(dto: RegisterUserDto, userId: number) {
    return await this.userService.updateUserInfo(dto, userId);
  }
}
