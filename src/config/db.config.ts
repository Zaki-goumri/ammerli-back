// src/config/db.config.ts
import { defineConfig } from '@mikro-orm/postgresql';
import { registerAs } from '@nestjs/config';

export default registerAs('database', () =>
  defineConfig({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    dbName: process.env.DB_NAME || '3ammerli',
    entities: ['./dist/**/*.entity.js'],
    entitiesTs: ['./src/**/*.entity.ts'],
    migrations: {
      path: './dist/migrations',
      pathTs: './src/migrations',
      tableName: 'mikro_orm_migrations',
    },
    discovery: { warnWhenNoEntities: process.env.NODE_ENV !== 'dev' },
    debug: process.env.NODE_ENV !== 'production',
    allowGlobalContext: true,
  }),
);
