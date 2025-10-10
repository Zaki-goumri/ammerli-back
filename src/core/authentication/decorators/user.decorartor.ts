import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { ExtendedRequest } from '../types/extended-req.type';
import { AccessTokenPayload } from '../interfaces/access-token-payload.interface';

export const USER = createParamDecorator(
  (data: keyof AccessTokenPayload, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<ExtendedRequest>();
    const { user } = request;
    console.log(user);
    if (!user) {
      throw new Error('User not found in request');
    }
    if (data) {
      return user[data];
    }

    return user;
  },
);
