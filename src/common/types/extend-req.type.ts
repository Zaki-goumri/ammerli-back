import { Request } from 'express';
import { JwtPayload } from 'src/core/authentication/interfaces/access-token-payload.interface';

export interface extendedReq extends Request {
  user: JwtPayload;
}
