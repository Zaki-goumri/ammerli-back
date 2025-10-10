import { Entity, Property } from '@mikro-orm/core';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from 'src/common/entities/base.entity';

@Entity({ tableName: 'categories' })
export class Category extends BaseEntity {
  @ApiProperty({
    description: 'The label of the category',
    example: 'Electronics',
  })
  @Property()
  label: string;
}
