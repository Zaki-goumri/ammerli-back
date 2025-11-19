import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';
import { ObjectService } from 'src/infrastructure/object-storage/object-storage.service';
import { BUCKET_TARGETS } from '../constants/buckets';

export const PRESIGNED_URL_FIELDS = 'presigned_url_fields';
export const PRESIGNED_URL_EXPIRY = 'presigned_url_expiry';
export const PRESIGNED_URL_BUCKET = 'presigned_url_bucket';

/**
 * Interceptor that converts object names to presigned URLs in response data
 * Works with @ConvertToPresignedUrls() decorator
 */

@Injectable()
export class PresignedUrlInterceptor implements NestInterceptor {
  constructor(
    private readonly objectStorageService: ObjectService,
    private readonly reflector: Reflector,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const fields = this.reflector.get<string[]>(
      PRESIGNED_URL_FIELDS,
      context.getHandler(),
    );
    const bucket = this.reflector.get<string>(
      PRESIGNED_URL_BUCKET,
      context.getHandler(),
    );
    const expiry =
      this.reflector.get<number>(PRESIGNED_URL_EXPIRY, context.getHandler()) ||
      24 * 60 * 60;

    if (!fields || fields.length === 0 || !bucket) {
      return next.handle();
    }

    return next.handle().pipe(
      switchMap(async (data) => {
        if (!data) return data;

        if (Array.isArray(data)) {
          return Promise.all(
            data.map((item) =>
              this.convertFields(item, fields, bucket, expiry),
            ),
          );
        }

        if (data.data && Array.isArray(data.data)) {
          data.data = await Promise.all(
            data.data.map((item) =>
              this.convertFields(item, fields, bucket, expiry),
            ),
          );
          return data;
        }
        const newData = this.convertFields(data, fields, bucket, expiry);
        return newData;
      }),
    );
  }

  private async convertFields(
    obj: any,
    fields: string[],
    bucket: string,
    expiry: number,
  ): Promise<any> {
    if (!obj || typeof obj !== 'object') return obj;

    console.log('=== Converting object ===');
    console.log('Fields to convert:', fields);
    console.log('Object keys:', Object.keys(obj));
    console.log('Bucket:', bucket);

    const result = { ...obj };

    for (const field of fields) {
      console.log(`Checking field: ${field}, exists: ${field in result}`);

      if (field in result) {
        const value = result[field];
        console.log(
          `Field ${field} value:`,
          value,
          'Type:',
          typeof value,
          'IsArray:',
          Array.isArray(value),
        );

        if (typeof value === 'string' && value) {
          console.log('Converting string for field:', field, value);
          result[field] = await this.objectStorageService.getPresignedUrl(
            value,
            bucket,
          );
          console.log('Converted to:', result[field]);
        } else if (Array.isArray(value)) {
          console.log('Array length:', value.length);
          if (value.length > 0) {
            console.log('First element type:', typeof value[0]);
          }

          if (value.length > 0 && typeof value[0] === 'string') {
            console.log('Converting array of strings for field:', field, value);
            result[field] = await Promise.all(
              value.map(async (v) => {
                if (typeof v === 'string' && v) {
                  const url = await this.objectStorageService.getPresignedUrl(
                    v,
                    bucket,
                  );
                  console.log(`Converted ${v} to ${url}`);
                  return url;
                }
                return v;
              }),
            );
            console.log('Final converted array:', result[field]);
          } else if (value.length > 0 && typeof value[0] === 'object') {
            console.log('Converting array of objects for field:', field);
            result[field] = await Promise.all(
              value.map((item) =>
                this.convertFields(item, fields, bucket, expiry),
              ),
            );
          }
        } else if (value && typeof value === 'object') {
          console.log('Converting nested object for field:', field);
          result[field] = await this.convertFields(
            value,
            fields,
            bucket,
            expiry,
          );
        }
      }
    }

    console.log('=== Returning result ===');
    console.log(JSON.stringify(result, null, 2));

    return result;
  }
}
