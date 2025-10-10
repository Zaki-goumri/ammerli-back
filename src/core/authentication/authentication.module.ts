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
import authConfig from 'src/config/auth.config';

@Module({
  imports: [UserModule, JwtModule, PassportModule, QueueModule],
  controllers: [AuthenticationController],
  providers: [
    AuthenticationService,
    AccessTokenStrategy,
    AccessTokenGuard,
    RefreshTokenStrategy,
    RefreshTokenGuard,
  ],
  exports: [AccessTokenGuard],
})
export class AuthenticationModule {}
