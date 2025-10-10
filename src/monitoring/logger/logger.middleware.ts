import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger(LoggerMiddleware.name);

  use(req: Request, res: Response, next: NextFunction) {
    const { method, originalUrl, body, query, params, headers } = req;

    this.logger.log(`--- Incoming Request ---`);
    this.logger.log(`Method: ${method}`);
    this.logger.log(`URL: ${originalUrl}`);

    if (Object.keys(query).length)
      this.logger.debug(`Query: ${JSON.stringify(query)}`);
    if (Object.keys(params).length)
      this.logger.debug(`Params: ${JSON.stringify(params)}`);
    if (Object.keys(body).length)
      this.logger.debug(`Body: ${JSON.stringify(body)}`);
    if (Object.keys(headers).length)
      this.logger.debug(`Headers: ${JSON.stringify(headers)}`);

    this.logger.log('------------------------');

    next();
  }
}
