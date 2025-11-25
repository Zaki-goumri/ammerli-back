import { SetMetadata, applyDecorators } from '@nestjs/common';
import {
  PRESIGNED_URL_FIELDS,
  PRESIGNED_URL_EXPIRY,
  PRESIGNED_URL_BUCKET,
  PRESIGNED_URL_CONFIGS_ARRAY,
} from '../interceptors/presigned-url.interceptor';

/**
 * Custom function to stack multiple presigned URL configurations.
 * This function handles the array building logic.
 * It must return void to be used inside applyDecorators for Method/Property Decorators.
 */
function ConfigStacker(fields: string[], bucket: string, expiry: number) {
  return (
    target: any,
    propertyKey?: string,
    descriptor?: PropertyDescriptor,
  ): void => {
    if (!descriptor || !descriptor.value) return;
    const existingConfigs =
      Reflect.getMetadata(PRESIGNED_URL_CONFIGS_ARRAY, descriptor.value) || [];
    const updatedConfigs = [...existingConfigs, { fields, bucket, expiry }];
    Reflect.defineMetadata(
      PRESIGNED_URL_CONFIGS_ARRAY,
      updatedConfigs,
      descriptor.value,
    );
  };
}

/**
 * Decorator to automatically convert object storage names to presigned URLs in responses.
 * Can be stacked multiple times for different fields/buckets.
 */
export function ConvertToPresignedUrls(
  fields: string[],
  bucket: string,
  expiry: number = 24 * 60 * 60,
) {
  // applyDecorators combines multiple decorators into one application.
  return applyDecorators(
    // 1. Set individual keys: Ensures basic compatibility with NestJS's Reflector.
    SetMetadata(PRESIGNED_URL_FIELDS, fields),
    SetMetadata(PRESIGNED_URL_BUCKET, bucket),
    SetMetadata(PRESIGNED_URL_EXPIRY, expiry),
    ConfigStacker(fields, bucket, expiry),
  );
}
