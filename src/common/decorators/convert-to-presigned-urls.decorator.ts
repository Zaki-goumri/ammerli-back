import { SetMetadata, applyDecorators } from '@nestjs/common';
import {
  PRESIGNED_URL_FIELDS,
  PRESIGNED_URL_EXPIRY,
  PRESIGNED_URL_BUCKET,
  PRESIGNED_URL_CONFIGS_ARRAY,
} from '../interceptors/presigned-url.interceptor'; // <-- Ensure this path is correct

// --- Helper Function for Stacking Configurations ---

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
    // 💡 Explicitly set return type to void (or omit the return statement)
    if (!descriptor || !descriptor.value) return; // Add check for descriptor.value

    // Get existing configs or initialize empty array
    const existingConfigs =
      Reflect.getMetadata(PRESIGNED_URL_CONFIGS_ARRAY, descriptor.value) || [];

    // Add new config to the array
    const updatedConfigs = [...existingConfigs, { fields, bucket, expiry }];

    // Set the updated array
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

    // 2. Use the custom ConfigStacker: This function handles collecting
    //    all configurations into the array that your Interceptor processes.
    ConfigStacker(fields, bucket, expiry),
  );
}
