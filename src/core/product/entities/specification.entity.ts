import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

@Entity('specifications')
export class Specification extends BaseEntity {
  @ApiProperty({
    description: 'The label of the specification (e.g., Weight, Volume, Box)',
    example: 'Weight',
  })
  @Column({ unique: true })
  label: string;

  @ApiPropertyOptional({
    description: 'The unit of the specification (e.g., kg, L, pcs). Optional.',
    example: 'kg',
  })
  @Column({ nullable: true })
  unity?: string;
}
