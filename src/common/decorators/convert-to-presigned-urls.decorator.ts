import { SetMetadata, applyDecorators } from '@nestjs/common';
import {
  PRESIGNED_URL_FIELDS,
  PRESIGNED_URL_EXPIRY,
} from '../interceptors/presigned-url.interceptor';

/**
 * Decorator to automatically convert object storage names to presigned URLs in responses
 * Must be used with PresignedUrlInterceptor at controller or method level
 * 
 * @param fields - Array of field names that contain object storage names
 * @param expiry - Expiry time in seconds for presigned URLs (default: 24 hours)
 * 
 * @example
 * // At controller level with interceptor
 * @UseInterceptors(PresignedUrlInterceptor)
 * @Controller('products')
 * export class ProductController {
 *   @ConvertToPresignedUrls(['pictureUrl', 'url'])
 *   @Get()
 *   findAll() { ... }
 * }
 * 
 * @example
 * // Custom expiry (1 hour)
 * @ConvertToPresignedUrls(['profilePic'], 3600)
 * @Get('me')
 * getMe() { ... }
 */
export function ConvertToPresignedUrls(
  fields: string[],
  expiry: number = 24 * 60 * 60,
) {
  return applyDecorators(
    SetMetadata(PRESIGNED_URL_FIELDS, fields),
    SetMetadata(PRESIGNED_URL_EXPIRY, expiry),
  );
}
