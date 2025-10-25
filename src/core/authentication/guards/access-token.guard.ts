import {
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { SKIP_REGISTRATION_CHECK_KEY } from '../decorators/skip-registration-check.decorator';
import { extendedReq } from 'src/common/types/extend-req.type';

@Injectable()
export class AccessTokenGuard extends AuthGuard('access-token') {
  constructor(private reflector: Reflector) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const authenticated = await super.canActivate(context);

    if (!authenticated) {
      return false;
    }

    const skipRegistrationCheck = this.reflector.getAllAndOverride<boolean>(
      SKIP_REGISTRATION_CHECK_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (skipRegistrationCheck) {
      return true;
    }

    const request = context.switchToHttp().getRequest<extendedReq>();
    const user = request.user;

    if (!user || !user?.isRegistered) {
      throw new ForbiddenException('User is not fully registered.');
    }

    return true;
  }
}
