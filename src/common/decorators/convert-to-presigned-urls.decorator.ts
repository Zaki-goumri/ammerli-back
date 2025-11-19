import { SetMetadata, applyDecorators } from '@nestjs/common';
import {
  PRESIGNED_URL_FIELDS,
  PRESIGNED_URL_EXPIRY,
  PRESIGNED_URL_BUCKET,
} from '../interceptors/presigned-url.interceptor';

/**
 * Decorator to automatically convert object storage names to presigned URLs in responses
 * Must be used with PresignedUrlInterceptor at controller or method level
 *
 * @param fields - Array of field names that contain object storage names
 * @param bucket - The name of the bucket where the objects are stored
 * @param expiry - Expiry time in seconds for presigned URLs (default: 24 hours)
 *
 * @example
 * // At controller level with interceptor
 * @UseInterceptors(PresignedUrlInterceptor)
 * @Controller('users')
 * export class UserController {
 *   @ConvertToPresignedUrls(['avatar'], BUCKET_TARGETS.USER_PROFILE)
 *   @Get('me')
 *   getMe() { ... }
 * }
 */
export function ConvertToPresignedUrls(
  fields: string[],
  bucket: string,
  expiry: number = 24 * 60 * 60,
) {
  return applyDecorators(
    SetMetadata(PRESIGNED_URL_FIELDS, fields),
    SetMetadata(PRESIGNED_URL_BUCKET, bucket),
    SetMetadata(PRESIGNED_URL_EXPIRY, expiry),
  );
}
