import {
  Entity,
  EntityRepositoryType,
  PrimaryKey,
  Property,
} from '@mikro-orm/core';
import { AddressRepository } from '../repositories/adress.repository';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BaseEntity } from 'src/common/entities/base.entity';

@Entity({ repository: () => AddressRepository })
export class Address extends BaseEntity {
  [EntityRepositoryType]?: AddressRepository;

  @ApiPropertyOptional({
    description: 'Street name of the address',
    example: '123 Rue Didouche Mourad',
  })
  @Property({ nullable: true })
  street?: string;

  @ApiPropertyOptional({
    description: 'City where the address is located',
    example: 'Algiers',
  })
  @Property({ nullable: true })
  city?: string;

  @ApiPropertyOptional({
    description: 'District/Commune of the address',
    example: 'Bab El Oued',
  })
  @Property({ nullable: true })
  district?: string;
}
