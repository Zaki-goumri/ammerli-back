import { InternalServerErrorException } from '@nestjs/common';

/**
 * Custom exception for errors originating from the MinIO client.
 * It extends InternalServerErrorException and includes the original error code from MinIO.
 */
export class MinioError extends InternalServerErrorException {
  public readonly code: string;

  /**
   * @param message The original error message.
   * @param code The error code from the MinIO client (e.g., 'NoSuchBucket').
   */
  constructor(message: string, code: string) {
    super(message);
    this.code = code;
  }
}
