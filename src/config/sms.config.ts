import { registerAs } from '@nestjs/config';
import { SmsConfig } from './interfaces/sms-config.interface';

export default registerAs(
  'sms',
  (): SmsConfig => ({
    smssak: {
      country: process.env.SMSSAK_COUNTRY || 'dz',
      projectId: process.env.SMSSAK_PROJECT_ID!,
      key: process.env.SMSSAK_KEY!,
      type: process.env.SMSSAK_TYPE || 'sms',
    },
  }),
);
