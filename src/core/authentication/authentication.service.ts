import {
  ForbiddenException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { RedisService } from 'nestjs-redis-client';
import authConfig from 'src/config/auth.config';
import { User } from '../user/entities/user.entity';
import { UserService } from '../user/user.service';
import { OtpValidationDto } from './dtos/requests/otp-validation.dto';
import { RegisterUserDto } from './dtos/requests/register-user.dto';
import { AuthResDto } from './dtos/response/refresh-token.dto';
import { SendOtpDto } from './dtos/response/send-otp.dto';
import { ValidateOtpDto } from './dtos/response/validate-otp.dto';
import { BlackListService } from '../user/black-list/black-list.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { QUEUE_NAME } from 'src/common/constants/queues';

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
    private readonly blackListService: BlackListService,
    @InjectQueue(QUEUE_NAME.SMS) private readonly smsQueue: Queue,
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
  async validateOtp(dto: OtpValidationDto): Promise<ValidateOtpDto> {
    const { phoneNumber, otp } = dto;
    const cachedOtp = await this.redisService.get<string>(
      AuthenticationService.getCacheKey(phoneNumber),
    );
    if (!cachedOtp || cachedOtp !== otp) {
      throw new UnauthorizedException('Invalid or expired OTP');
    }
    await this.redisService.del(AuthenticationService.getCacheKey(phoneNumber));
    const user =
      await this.userService.findByPhoneNumberWithoutException(phoneNumber);
    if (!user) {
      const newUser = await this.userService.create({ phoneNumber });
      const accessToken = await this.issueAccessToken(newUser, false);
      return { accessToken, isRegistered: false };
    }
    const tokens = await this.issueTokens(user);
    if (!user?.isRegistered) {
      return { accessToken: tokens.accessToken, isRegistered: false };
    }
    return { ...tokens, isRegistered: true };
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
        //TODO: map user to UserDto properly
        user: user as any,
      };
    } catch (error) {
      this.logger.error('Error issuing tokens', error);
      throw new Error('Failed to issue tokens');
    }
  }

  private async issueAccessToken(
    user: User,
    isRegistered: boolean,
  ): Promise<string> {
    const { id, phoneNumber } = user;
    const accessTokenPayload = { id, phoneNumber, isRegistered };
    const jwtConfig = authConfig().jwt;
    const accessToken = await this.jwtService.signAsync(accessTokenPayload, {
      expiresIn: jwtConfig.accessTokenExpiresIn,
      secret: jwtConfig.accessTokenSecret,
    });
    return accessToken;
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
  async sendVerificationCode(phoneNumber: string): Promise<SendOtpDto> {
    const isBlacklisted = await this.blackListService.isPhoneNumberBlacklisted(
      phoneNumber,
    );
    if (isBlacklisted) {
      throw new ForbiddenException('This phone number is blacklisted.');
    }
    const otp = await this.generateAndSetOtp(phoneNumber);
    await this.smsQueue.add('send', {
      to: phoneNumber,
      body: `Your OTP is: ${otp}`,
    });
    return { message: `OTP sent to ${phoneNumber}` };
  }

  async registerUser(dto: RegisterUserDto, userId: number) {
    const user = await this.userService.registerUserInfo(dto, userId);
    const tokens = await this.issueTokens(user);
    return { ...tokens, isRegistered: true };
  }
}
