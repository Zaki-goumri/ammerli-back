import { registerAs } from '@nestjs/config';

export default registerAs('minio', () => ({
  endPoint: process.env.MINIO_ENDPOINT || 'localhost',
  port: parseInt(process.env.MINIO_PORT!, 10),
  accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
  secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
  useSSL: process.env.NODE_ENV === 'prod',
  bucket: process.env.MINIO_BUCKET_NAME || 'app-bucket',
  publicUrl: process.env.MINIO_PUBLIC_HOST || 'localhost',
}));
