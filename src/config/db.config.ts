import { registerAs } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export default registerAs(
  'database',
  (): TypeOrmModuleOptions => ({
    type: 'postgres',
    host: process.env.DB_PGBOUNCER_HOST || 'localhost',
    port: parseInt(process.env.DB_PGBOUNCER_PORT || '6432', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || '3ammerli',
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    migrations: [__dirname + '/../migrations/*{.ts,.js}'],
    synchronize: process.env.NODE_ENV !== 'prod',
    logging: process.env.NODE_ENV !== 'prod',
    migrationsRun: true,
    extra: {
      timezone: 'Africa/Algiers',
      max: parseInt(process.env.DATABASE_CONNECTION_POOL_MAX || '50', 10),
      min: parseInt(process.env.DATABASE_CONNECTION_POOL_MIN || '10', 10),
      idleTimeoutMillis: parseInt(
        process.env.DATABASE_IDLE_TIMEOUT || '30000',
        10,
      ),
      connectionTimeoutMillis: parseInt(
        process.env.DATABASE_CONNECTION_TIMEOUT || '5000',
        10,
      ),
      allowExitOnIdle: false,
      acquireTimeoutMillis: parseInt(
        process.env.DATABASE_ACQUIRE_TIMEOUT || '30000',
        10,
      ),
      query_timeout: parseInt(
        process.env.DATABASE_QUERY_TIMEOUT || '30000',
        10,
      ),
    },
  }),
);
