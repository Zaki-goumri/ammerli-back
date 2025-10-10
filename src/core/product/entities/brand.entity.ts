import { Entity, Property } from '@mikro-orm/core';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from 'src/common/entities/base.entity';

@Entity({ tableName: 'brands' })
export class Brand extends BaseEntity {
  @ApiProperty({
    description: 'The label of the brand',
    example: 'Coca-Cola',
  })
  @Property()
  label: string;
}
