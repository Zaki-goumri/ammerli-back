import { SetMetadata } from '@nestjs/common';

export const SKIP_REGISTRATION_CHECK_KEY = 'skipRegistrationCheck';
export const SkipRegistrationCheck = () =>
  SetMetadata(SKIP_REGISTRATION_CHECK_KEY, true);
