import { registerAs } from '@nestjs/config';
import { DatabaseConfig } from './interfaces/database-config.interface';

export default registerAs(
  'database',
  (): DatabaseConfig => ({
    type: 'postgresql',
    host: process.env.DB_HOST || 'db',
    port: parseInt(process.env.DB_PORT!, 10) || 5432,
    user: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    dbName: process.env.DB_NAME || 'deven',
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    entitiesTs: [__dirname + '/../**/*.entity.ts'],
    autoLoadEntities: true,
    migrations: {
      path: __dirname + '/migrations',
      tableName: 'mikro_orm_migrations',
    },
    debug: process.env.NODE_ENV === 'dev' || true,
  }),
);
