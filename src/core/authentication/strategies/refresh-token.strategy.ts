import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { RefreshTokenPayload } from '../interfaces/refresh-token.dto';
import { UserService } from 'src/core/user/user.service';
import authConfig from 'src/config/auth.config';
import { I18nService } from 'nestjs-i18n';
import { Request } from 'express';

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(
  Strategy,
  'refresh-token',
) {
  constructor(
    @Inject(authConfig.KEY) configService: ConfigType<typeof authConfig>,
    private readonly userService: UserService,
    private readonly i18nService: I18nService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.jwt.refreshTokenSecret,
      passReqToCallback: true,
    });
  }

  async validate(
    req: Request,
    payload: RefreshTokenPayload,
  ): Promise<RefreshTokenPayload> {
    if (!payload?.id || !payload?.phoneNumber) {
      throw new UnauthorizedException({
        key: 'auth.strategy.invalidTokenPayload',
      });
    }
    const user = this.userService.findById(payload.id);
    if (!user) {
      throw new UnauthorizedException({
        key: 'auth.strategy.userNotFound',
        args: { id: payload.id },
      });
    }
    return {
      id: payload.id,
      phoneNumber: payload.phoneNumber,
    };
  }
}
