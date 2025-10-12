import { Entity, Column } from 'typeorm';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('addresses')
export class Address extends BaseEntity {
  @ApiPropertyOptional({
    description: 'Street name of the address',
    example: '123 Rue Didouche Mourad',
  })
  @Column({ nullable: true })
  street?: string;

  @ApiPropertyOptional({
    description: 'City where the address is located',
    example: 'Algiers',
  })
  @Column({ nullable: true })
  city?: string;

  @ApiPropertyOptional({
    description: 'District/Commune of the address',
    example: 'Bab El Oued',
  })
  @Column({ nullable: true })
  district?: string;
}
