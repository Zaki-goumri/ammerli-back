import { Entity, Column, DeleteDateColumn } from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('brands')
export class Brand extends BaseEntity {
  @ApiProperty({
    description: 'The label of the brand',
    example: 'Coca-Cola',
  })
  @Column({ unique: true })
  label: string;

  @ApiPropertyOptional({
    description: 'Timestamp when the brand was soft deleted',
    example: '2023-10-05T14:48:00.000Z',
    nullable: true,
  })
  @DeleteDateColumn()
  deletedAt?: Date;
}
