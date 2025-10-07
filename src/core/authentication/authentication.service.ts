import {
  Injectable,
  Logger,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import {
  compareHash,
  generateHash,
} from 'src/common/utils/authentication/argno2.utils';
import { AuthResponseDto } from './dtos/responses/auth-response.dto';
import { JwtService } from '@nestjs/jwt';
import { RedisService } from 'nestjs-redis-client';
import { v4 as uuidv4 } from 'uuid';
import authConfig from 'src/config/auth.config';
import { UserService } from '../user/user.service';
import { User } from '../user/entities/user.entity';
import { OtpValidationDto } from './dtos/requests/otp-validation.dto';
import { NoRegisteredUserDto } from './dtos/responses/no-registered-user.dto';

@Injectable()
export class AuthenticationService {
  logger = new Logger(AuthenticationService.name);
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly redisService: RedisService,
  ) {}

  static CACHE_KEY_PREFIX = 'otp';

  static getCacheKey(key: string): string {
    return `${this.CACHE_KEY_PREFIX}:${key}`;
  }

  async validateOtp(
    dto: OtpValidationDto,
  ): Promise<
    (AuthResponseDto & { isRegistered: boolean }) | NoRegisteredUserDto
  > {
    const { phone, otp } = dto;
    const cachedOtp = await this.redisService.get<string>(
      AuthenticationService.getCacheKey(phone),
    );
    if (!cachedOtp || cachedOtp !== otp) {
      throw new UnauthorizedException('Invalid or expired OTP');
    }
    const cachedUser = await this.redisService.get<
      User & { isRegistered: boolean }
    >(UserService.getCacheKey(phone));
    if (cachedUser && cachedUser.isRegistered) {
      await this.redisService.del(AuthenticationService.getCacheKey(phone));
      const authResponse = await this.issueTokens(cachedUser);
      return { ...authResponse, isRegistered: true };
    }
    await this.setRegistraionSession(phone);
    return {
      isRegistered: false,
      message: 'otp validated, proceed to registration',
    };
  }

  async issueTokens(user: User): Promise<AuthResponseDto> {
    try {
      const { id, phone } = user;
      const accessTokenPayload = { sub: id, phone };
      const refreshTokenPayload = { sub: id, phone, type: 'refresh' };

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

  private async setRegistraionSession(phone: string): Promise<void> {
    await this.redisService.set(
      `user-registration:${phone}`,
      { phone, isRegistered: false },
      600,
    );
  }

  private async generateAndSetOtp(phone: string): Promise<string> {
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    await this.redisService.set(
      AuthenticationService.getCacheKey(phone),
      otp,
      600,
    );
    return otp;
  }

  async sendVerificationCode(phone: string) {
    const otp = await this.generateAndSetOtp(phone);
    //TODO: Send sms with OTP
    this.logger.log(`OTP for ${phone}: ${otp}`);
    return { message: `OTP sent to ${phone}` };
  }

  async resendVerificationCode(phone: string) {
    const user = await this.userService.findByPhone(phone);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    await this.sendVerificationCode(phone);
    return {
      message: 'Verification code sent successfully. Please check your email.',
    };
  }

  async forgotPassword(phone: string) {
    const user = await this.userService.findByPhone(phone);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const token = uuidv4();
    await this.redisService.set(`password-reset:${token}`, user.phone, 600);
    //TODO: Send sms with token
    return {
      message:
        'Password reset email sent successfully. Please check your email.',
    };
  }

  async resetPassword(token: string, password: string) {
    const email = await this.redisService.get<string>(
      `password-reset:${token}`,
    );
    if (!email) {
      throw new BadRequestException('Invalid reset token');
    }
    const user = await this.userService.findByPhone(email);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    user.password = await generateHash(password);
    await this.userService.updateUser(user);
    await this.redisService.del(`password-reset:${token}`);
    return {
      message: 'Password reset successfully.',
    };
  }
}
