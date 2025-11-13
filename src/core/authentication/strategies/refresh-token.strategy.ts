import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { RefreshTokenPayload } from '../interfaces/refresh-token.dto';
import { UserService } from 'src/core/user/user.service';
import authConfig from 'src/config/auth.config';

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(
  Strategy,
  'refresh-token',
) {
  constructor(
    @Inject(authConfig.KEY) configService: ConfigType<typeof authConfig>,
    private readonly userService: UserService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.jwt.refreshTokenSecret,
    });
  }

  async validate(payload: RefreshTokenPayload): Promise<RefreshTokenPayload> {
    if (!payload?.id || !payload?.phoneNumber) {
      throw new UnauthorizedException('Invalid token payload');
    }
    const user = this.userService.findById(payload.id);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return {
      id: payload.id,
      phoneNumber: payload.phoneNumber,
    };
  }
}
