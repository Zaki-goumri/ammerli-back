import { Options } from '@mikro-orm/core';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';

/**
 * Defines the configuration structure for MikroORM when integrated with NestJS.
 * Extends the core MikroORM Options, explicitly using the PostgreSqlDriver.
 */
export interface DatabaseConfig extends Options<PostgreSqlDriver> {
  type: 'postgresql';
  host: string;
  port: number;
  user: string;
  password: string;
  dbName: string;
  entities: string[];
  entitiesTs: string[];
  autoLoadEntities?: boolean;
  migrations?: {
    path?: string;
    tableName?: 'mikro_orm_migrations';
  };
  debug?: boolean;
  allowGlobalContext?: true;
}
