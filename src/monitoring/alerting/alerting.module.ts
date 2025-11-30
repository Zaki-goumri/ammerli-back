import { Module } from '@nestjs/common';
import { SlackService } from './slack.service';
import { ConfigType } from '@nestjs/config';
import appConfig from 'src/config/app.config';
import { HttpModule, HttpService } from '@nestjs/axios';

export const ALERTING_SERVICE = 'AlertingService';

@Module({
  imports: [HttpModule],
  providers: [
    {
      provide: ALERTING_SERVICE,
      useFactory: (
        configService: ConfigType<typeof appConfig>,
        httpService: HttpService,
      ): SlackService => {
        const url = configService.slackWebhookUrl;
        if (!url) {
          throw new Error('Slack webhook URL is not configured in app config.');
        }
        return new SlackService(url, httpService);
      },
      inject: [appConfig.KEY, HttpService],
    },
  ],
  exports: [ALERTING_SERVICE],
})
export class AlertingModule {}
