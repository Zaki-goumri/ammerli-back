import { FastifyRequest } from 'fastify';
import { JwtPayload } from 'src/core/authentication/interfaces/access-token-payload.interface';

export interface extendedReq extends FastifyRequest {
  user: JwtPayload;
}
