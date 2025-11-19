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
        console.table(newData);
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

    const result = { ...obj };

    for (const field of fields) {
      if (field in result) {
        const value = result[field];
        if (typeof value === 'string' && value) {
          result[field] = await this.objectStorageService.getPresignedUrl(
            value,
            bucket,
          );
        } else if (Array.isArray(value)) {
          if (value.length > 0 && typeof value[0] === 'string') {
            result[field] = await Promise.all(
              value
                .filter((v) => typeof v === 'string')
                .map((v) =>
                  this.objectStorageService.getPresignedUrl(v, bucket),
                ),
            );
          } else if (value.length > 0 && typeof value[0] === 'object') {
            result[field] = await Promise.all(
              value.map((item) =>
                this.convertFields(item, fields, bucket, expiry),
              ),
            );
          }
        } else if (value && typeof value === 'object') {
          result[field] = await this.convertFields(
            value,
            fields,
            bucket,
            expiry,
          );
        }
      }
    }

    return result;
  }
}
