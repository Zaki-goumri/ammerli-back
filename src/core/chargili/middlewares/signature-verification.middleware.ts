import {
  Injectable,
  NestMiddleware,
  BadRequestException,
  ForbiddenException,
  Logger,
  Inject,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ConfigType } from '@nestjs/config';
import * as crypto from 'crypto';
import chargiliConfig from 'src/config/chargili.config';

@Injectable()
export class ChargilyWebhookMiddleware implements NestMiddleware {
  private readonly logger = new Logger(ChargilyWebhookMiddleware.name);

  constructor(
    @Inject(chargiliConfig.KEY)
    private readonly chargiliConf: ConfigType<typeof chargiliConfig>,
  ) {}

  use(req: Request, res: Response, next: NextFunction) {
    const signature = req.get('signature');

    if (!signature) {
      this.logger.warn('Webhook received without signature');
      throw new BadRequestException('Missing signature header');
    }
    const payload = JSON.stringify(req.body);
    const apiSecretKey = this.chargiliConf.api_key;
    if (!apiSecretKey) {
      this.logger.error('CHARGILI_API_KEY not configured');
      throw new Error('API key not configured');
    }

    const computedSignature = crypto
      .createHmac('sha256', apiSecretKey.trim())
      .update(payload)
      .digest('hex');

    if (computedSignature !== signature) {
      this.logger.warn('Invalid webhook signature');
      throw new ForbiddenException('Invalid webhook signature');
    }
    this.logger.log('Webhook signature verified successfully');
    next();
  }
}
