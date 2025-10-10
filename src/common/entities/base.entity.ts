import {
  BaseEntity as MikroBaseEntity,
  PrimaryKey,
  Property,
} from '@mikro-orm/core';
import { ApiProperty } from '@nestjs/swagger';

export abstract class BaseEntity extends MikroBaseEntity {
  @ApiProperty({
    description: 'Unique identifier for the user',
    example: 1,
  })
  @PrimaryKey({ type: 'number', autoincrement: true })
  id: number;
  @ApiProperty({
    description: 'Timestamp when the entity was created',
    example: '2023-10-05T14:48:00.000Z',
  })
  @Property({
    columnType: 'timestamptz',
    defaultRaw: 'now()',
  })
  createdAt?: Date;

  @ApiProperty({
    description: 'Timestamp when the entity was last updated',
    example: '2023-10-05T14:48:00.000Z',
  })
  @Property({
    columnType: 'timestamptz',
    defaultRaw: 'now()',
    onUpdate: () => new Date(),
  })
  updatedAt?: Date;
}
