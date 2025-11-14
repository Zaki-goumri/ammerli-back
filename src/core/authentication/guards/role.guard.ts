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
@Injectable()
export class RoleGuard implements CanActivate {
  constructor(private reflector: Reflector) {}
  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<UserRole[]>(
      ROLES_KEY,
      context.getHandler(),
    );
    if (!requiredRoles) return true;
    const request = context.switchToHttp().getRequest<extendedReq>();
    const user = request.user as AccessTokenPayload;
    if (!user || !user?.role)
      throw new ForbiddenException('No user role specified');
    if (!USER_ROLE_VALUES.includes(user.role))
      throw new ForbiddenException('Invalid user role');
    const hasRole = requiredRoles.includes(user.role);
    if (!hasRole)
      throw new UnauthorizedException(
        `Role ${user.role} is not authorized for this action`,
      );
    return hasRole;
  }
}
