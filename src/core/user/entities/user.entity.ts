import { Entity, Column, OneToOne, JoinColumn, OneToMany } from 'typeorm';
import { FavProduct } from '../../product/entities/fav-product.entity';
import { Product } from '../../product/entities/product.entity';
import { Address } from './address.entity';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  USER_ROLE_VALUES,
  UserRole,
  USER_ROLES,
} from '../enums/user-role.enum';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('users')
export class User extends BaseEntity {
  @ApiProperty({
    description: 'User phone number',
    example: '+213551234567',
  })
  @Column({ unique: true })
  phoneNumber: string;

  @ApiPropertyOptional({
    description: 'Full name of the user',
    example: 'John Doe',
  })
  @Column({ nullable: true })
  name?: string;

  @ApiPropertyOptional({
    description: 'Optional Google Maps location URL',
    example: 'https://maps.google.com/?q=36.7528,3.0422',
  })
  @Column({ nullable: true })
  locationUrl?: string;

  @ApiPropertyOptional({
    description: 'Linked address of the user',
    type: () => Address,
  })
  @OneToOne(() => Address, { cascade: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'address_id' })
  address?: Address;

  @ApiProperty({
    description: 'Name of the supermarket (for sellers)',
    example: 'Market El Baraka',
  })
  @Column({ nullable: true })
  supermarketName?: string;

  @ApiPropertyOptional({
    description: 'Profile picture URL',
    example: 'https://cdn.example.com/avatars/user123.jpg',
  })
  @Column({ nullable: true })
  profilePic?: string;

  @ApiProperty({
    description: 'Role of the user',
    enum: USER_ROLE_VALUES,
    example: 'ADMIN',
  })
  @Column({
    type: 'enum',
    enum: USER_ROLE_VALUES,
    default: USER_ROLES.SUPERMARKET,
  })
  role?: UserRole;

  @ApiProperty({
    description: 'List of favorite products',
    type: () => [FavProduct],
  })
  @OneToMany(() => FavProduct, (favProduct) => favProduct.user)
  favoriteProducts: FavProduct[];

  @ApiProperty({
    description: 'List of products added by the user (if seller)',
    type: () => [Product],
  })
  @OneToMany(() => Product, (product) => product.seller)
  products: Product[];
}
