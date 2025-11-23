import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { USER_ROLE_VALUES, UserRole } from 'src/common/enums/user-role.enum';
import { ROLES_KEY } from 'src/core/authentication/decorators/role.decorator';
import { extendedReq } from 'src/common/types/extend-req.type';
import { AccessTokenPayload } from '../interfaces/access-token-payload.interface';
import { I18nContext, I18nService } from 'nestjs-i18n';

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private readonly i18n: I18nService,
  ) {}
  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<UserRole[]>(
      ROLES_KEY,
      context.getHandler(),
    );
    if (!requiredRoles) return true;
    const request = context.switchToHttp().getRequest<extendedReq>();
    const user = request.user as AccessTokenPayload;
    const i18n = I18nContext.current(context);

    if (!user || !user?.role)
      throw new ForbiddenException(i18n?.t('auth.guard.noRole'));
    if (!USER_ROLE_VALUES.includes(user.role))
      throw new ForbiddenException(i18n?.t('auth.guard.invalidRole'));
    const hasRole = requiredRoles.includes(user.role);
    if (!hasRole)
      throw new UnauthorizedException(
        i18n?.t('auth.guard.unauthorizedRole', { args: { role: user.role } }),
      );
    return hasRole;
  }
}
