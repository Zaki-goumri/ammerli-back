import { Entity, Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('brands')
export class Brand extends BaseEntity {
  @ApiProperty({
    description: 'The label of the brand',
    example: 'Coca-Cola',
  })
  @Column({ unique: true })
  label: string;
}
