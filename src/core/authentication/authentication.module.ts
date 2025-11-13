import { Module } from '@nestjs/common';
import { AuthenticationService } from './authentication.service';
import { AuthenticationController } from './authentication.controller';
import { AccessTokenStrategy } from './strategies/access-token.strategy';
import { AccessTokenGuard } from './guards/access-token.guard';
import { RefreshTokenStrategy } from './strategies/refresh-token.strategy';
import { RefreshTokenGuard } from './guards/refresh-token.guard';
import { JwtModule } from '@nestjs/jwt';
import { UserModule } from '../user/user.module';
import { QueueModule } from 'src/infrastructure/queue/queue.module';
import { PassportModule } from '@nestjs/passport';
import { OtpStrategy } from './strategies/otp/otp.strategy';
import { DefaultOtpStrategy } from './strategies/otp/default-otp.strategy';
import { SmsSakOtpStrategy } from './strategies/otp/smssak-otp.strategy';
import { ConfigService } from '@nestjs/config';

import { BlackListModule } from '../user/black-list/black-list.module';

@Module({
  imports: [UserModule, JwtModule, PassportModule, QueueModule, BlackListModule],
  controllers: [AuthenticationController],
  providers: [
    AuthenticationService,
    AccessTokenStrategy,
    AccessTokenGuard,
    RefreshTokenStrategy,
    RefreshTokenGuard,
    DefaultOtpStrategy,
    SmsSakOtpStrategy,
    {
      provide: OtpStrategy,
      useFactory: (
        configService: ConfigService,
        defaultStrategy: DefaultOtpStrategy,
        smsSakStrategy: SmsSakOtpStrategy,
      ) => {
        const provider = configService.get<string>('OTP_PROVIDER');
        //TODO: change 'SMSSAK' to the actual value you want to use to select the SmsSak strategy
        if (provider !== 'SMSSAK') {
          return smsSakStrategy;
        }
        return defaultStrategy;
      },
      inject: [ConfigService, DefaultOtpStrategy, SmsSakOtpStrategy],
    },
  ],
  exports: [AccessTokenGuard],
})
export class AuthenticationModule {}
