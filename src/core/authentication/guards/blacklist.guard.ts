
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { BlackListService } from 'src/core/user/black-list/black-list.service';
import { AccessTokenPayload } from '../interfaces/access-token-payload.interface';

@Injectable()
export class BlacklistGuard implements CanActivate {
  constructor(
    private readonly blackListService: BlackListService,
    private readonly i18nService: I18nService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user as AccessTokenPayload;

    if (!user) {
      return true;
    }

    const isBlacklisted = await this.blackListService.isPhoneNumberBlacklisted(
      user.phoneNumber,
    );

    if (isBlacklisted) {
      throw new ForbiddenException(
        this.i18nService.t('user.blacklisted'),
      );
    }

    return true;
  }
}
