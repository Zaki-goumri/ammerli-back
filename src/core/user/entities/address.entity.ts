import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BaseEntity } from '../../../common/entities/base.entity';
import { User } from './user.entity';

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

  @ApiProperty({
    description: 'User ID who owns the address',
    example: 1,
  })
  @Column()
  userId: number;

  @ManyToOne(() => User, (user) => user.addresses)
  @JoinColumn({ name: 'userId' })
  user: User;
}
