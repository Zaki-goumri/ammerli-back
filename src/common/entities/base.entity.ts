import {
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  BaseEntity as TypeOrmBaseEntity,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

export abstract class BaseEntity extends TypeOrmBaseEntity {
  @ApiProperty({
    description: 'Unique identifier for the entity',
    example: 1,
  })
  @PrimaryGeneratedColumn('increment')
  @Index()
  id: number;

  @ApiProperty({
    description: 'Timestamp when the entity was created',
    example: '2023-10-05T14:48:00.000Z',
  })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({
    description: 'Timestamp when the entity was last updated',
    example: '2023-10-05T14:48:00.000Z',
  })
  @UpdateDateColumn()
  updatedAt?: Date;
}
