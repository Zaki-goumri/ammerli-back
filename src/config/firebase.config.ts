import { registerAs } from '@nestjs/config';

export default registerAs('firebase', () => ({
  serviceAccountPath: process.env.FIREBASE_SERVICE_ACCOUNT_KEY_PATH || '',
}));
