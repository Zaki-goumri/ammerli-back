import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { register } from 'tsconfig-paths';
import { resolve } from 'path';

config();

// Register tsconfig paths for TypeORM CLI
register({
  baseUrl: resolve(__dirname, '..'),
  paths: {
    'src/*': ['src/*'],
  },
});

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || '3ammerli',
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
  synchronize: false,
});
