import {
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { SKIP_REGISTRATION_CHECK_KEY } from '../decorators/skip-registration-check.decorator';
import { extendedReq } from 'src/common/types/extend-req.type';
import {
  isAccessTokenPayload,
  isRegistrationTokenPayload,
} from '../interfaces/access-token-payload.interface';
import { I18nContext, I18nService } from 'nestjs-i18n';

@Injectable()
export class AccessTokenGuard extends AuthGuard('access-token') {
  constructor(
    private reflector: Reflector,
    private readonly i18n: I18nService,
  ) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const authenticated = await super.canActivate(context);

    if (!authenticated) {
      const message = this.i18n.translate(
        'auth.guard.FORBIDDEN_RESOURCE_ACCESS',
      );
      throw new ForbiddenException(message);
    }

    const request = context.switchToHttp().getRequest<extendedReq>();
    const user = request.user;

    const skipRegistrationCheck = this.reflector.getAllAndOverride<boolean>(
      SKIP_REGISTRATION_CHECK_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (skipRegistrationCheck && isRegistrationTokenPayload(user)) {
      return true;
    }

    if (!isAccessTokenPayload(user)) {
      const message = this.i18n.translate(
        'auth.guard.FORBIDDEN_RESOURCE_ACCESS',
      );
      throw new ForbiddenException(message);
    }
    return true;
  }
}
