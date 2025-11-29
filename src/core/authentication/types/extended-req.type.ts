import { FastifyRequest } from 'fastify';
import { AccessTokenPayload } from '../interfaces/access-token-payload.interface';
export interface ExtendedRequest extends FastifyRequest {
  user: AccessTokenPayload;
}
