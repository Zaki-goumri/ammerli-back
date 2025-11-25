import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';
import { ObjectService } from 'src/infrastructure/object-storage/object-storage.service';

export const PRESIGNED_URL_CONFIGS_ARRAY = 'presigned_url_configs_array';
export const PRESIGNED_URL_FIELDS = 'presigned_url_fields';
export const PRESIGNED_URL_EXPIRY = 'presigned_url_expiry';
export const PRESIGNED_URL_BUCKET = 'presigned_url_bucket';

interface PresignedUrlConfig {
  fields: string[];
  bucket: string;
  expiry: number;
}

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
    const configs = this.reflector.get<PresignedUrlConfig[]>(
      PRESIGNED_URL_CONFIGS_ARRAY,
      context.getHandler(),
    );

    if (!configs || configs.length === 0) {
      return next.handle();
    }

    return next.handle().pipe(
      switchMap(async (data) => {
        if (!data) return data;
        return this.applyAllConversions(data, configs);
      }),
    );
  }

  private async applyAllConversions(
    data: any,
    configs: PresignedUrlConfig[],
  ): Promise<any> {
    if (!data) return data;

    if (Array.isArray(data)) {
      return Promise.all(
        data.map((item) => this.applyConfigsToItem(item, configs)),
      );
    }

    if (data.data && Array.isArray(data.data)) {
      data.data = await Promise.all(
        data.data.map((item) => this.applyConfigsToItem(item, configs)),
      );
      return data;
    }

    return this.applyConfigsToItem(data, configs);
  }

  private async applyConfigsToItem(
    item: any,
    configs: PresignedUrlConfig[],
  ): Promise<any> {
    let convertedItem = { ...item };

    for (const config of configs) {
      convertedItem = await this.convertFields(
        convertedItem,
        config.fields,
        config.bucket,
        config.expiry,
      );
    }

    return convertedItem;
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
      if (field.includes('.')) {
        const parts = field.split('.');
        const firstPart = parts[0];
        const restPath = parts.slice(1).join('.');

        if (firstPart in result) {
          const value = result[firstPart];

          if (Array.isArray(value)) {
            result[firstPart] = await Promise.all(
              value.map((item) =>
                this.convertFields(item, [restPath], bucket, expiry),
              ),
            );
          } else if (value && typeof value === 'object') {
            result[firstPart] = await this.convertFields(
              value,
              [restPath],
              bucket,
              expiry,
            );
          }
        }
      } else {
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
                value.map(async (v) => {
                  if (typeof v === 'string' && v) {
                    return await this.objectStorageService.getPresignedUrl(
                      v,
                      bucket,
                    );
                  }
                  return v;
                }),
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
    }
    return result;
  }
}
