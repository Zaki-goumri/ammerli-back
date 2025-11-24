import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPayload } from '../interfaces/access-token-payload.interface';
import authConfig from 'src/config/auth.config';
import { I18nService } from 'nestjs-i18n';
import { Request } from 'express';

@Injectable()
export class AccessTokenStrategy extends PassportStrategy(
  Strategy,
  'access-token',
) {
  constructor(
    @Inject(authConfig.KEY) configService: ConfigType<typeof authConfig>,
    private readonly i18n: I18nService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: process.env.NODE_ENV !== 'prod',
      secretOrKey: configService.jwt.accessTokenSecret,
      passReqToCallback: true,
    });
  }

  validate(req: Request, payload: JwtPayload): JwtPayload {
    if (!payload) {
      throw new UnauthorizedException({
        key: 'auth.strategy.invalidTokenPayload',
      });
    }
    return payload;
  }
}
