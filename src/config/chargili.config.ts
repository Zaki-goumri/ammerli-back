import { registerAs } from '@nestjs/config';
import { ChargilyClientOptions } from '@zaki-g/chargili';

export default registerAs(
  'chargili',
  (): ChargilyClientOptions => ({
    api_key: process.env.CHARGILI_API_KEY || '',
    version: process.env.CHARGILI_API_VERSION || 'v2',
    mode: process.env.CHARGILI_MODE === 'live' ? 'live' : 'test',
  }),
);
