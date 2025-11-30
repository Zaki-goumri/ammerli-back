import { Injectable, Logger } from '@nestjs/common';
import { AlertingService } from './interfaces/alerting.interface';
import { HttpService } from '@nestjs/axios';
import { catchError, firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';

@Injectable()
export class SlackService implements AlertingService {
  private readonly logger = new Logger(SlackService.name);
  private readonly webhookUrl: string;

  constructor(
    webhookUrl: string,
    private readonly httpService: HttpService,
  ) {
    this.webhookUrl = webhookUrl;
    this.logger.log(`Slack Webhook URL from config: ${this.webhookUrl}`);
  }

  async sendAlert(message: string): Promise<void> {
    if (!this.webhookUrl) {
      this.logger.warn('Slack webhook URL not configured. Alert not sent.');
      this.logger.log(`ALERT: ${message}`);
      return;
    }
    this.logger.log(`Sending Slack alert: ${message}`);
    try {
      await firstValueFrom(
        this.httpService.post(this.webhookUrl, { text: message }).pipe(
          catchError((error: AxiosError) => {
            this.logger.error(
              `Failed to send Slack alert: ${error.message}`,
              error.stack,
              error.response?.data,
            );
            throw error;
          }),
        ),
      );
    } catch (error) {}
  }
}
