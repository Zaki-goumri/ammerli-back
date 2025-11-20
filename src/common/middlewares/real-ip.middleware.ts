import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class RealIpMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const forwardedFor = req.headers['x-forwarded-for'];
    
    if (forwardedFor) {
      const realIp = (Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor)
        .split(',')[0]
        .trim();

      Object.defineProperty(req, 'ip', {
        configurable: true,
        enumerable: true,
        get: () => realIp,
      });
    }

    next();
  }
}
