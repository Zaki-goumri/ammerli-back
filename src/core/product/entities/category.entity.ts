import { Entity, Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('categories')
export class Category extends BaseEntity {
  @ApiProperty({
    description: 'The label of the category',
    example: 'Electronics',
  })
  @Column()
  label: string;
}
