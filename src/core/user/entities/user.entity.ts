import {
  Entity,
  Property,
  EntityRepositoryType,
  OneToOne,
  Enum,
  Collection,
  OneToMany,
} from '@mikro-orm/core';
import { FavProduct } from '../../product/entities/fav-product.entity';
import { Product } from '../../product/entities/product.entity';
import { UserRepository } from '../repositories/user.repository';
import { Address } from './address.entity';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  USER_ROLE_VALUES,
  UserRole,
  USER_ROLES,
} from '../enums/user-role.enum';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity({ repository: () => UserRepository })
export class User extends BaseEntity {
  [EntityRepositoryType]?: UserRepository;

  @ApiProperty({
    description: 'User phone number',
    example: '+213551234567',
  })
  @Property({ nullable: false, unique: true })
  phoneNumber: string;

  @ApiPropertyOptional({
    description: 'Full name of the user',
    example: 'John Doe',
  })
  @Property({ nullable: true })
  name?: string;

  @ApiPropertyOptional({
    description: 'Optional Google Maps location URL',
    example: 'https://maps.google.com/?q=36.7528,3.0422',
  })
  @Property({ nullable: true })
  locationUrl?: string;

  @ApiPropertyOptional({
    description: 'Linked address of the user',
    type: () => Address,
  })
  @OneToOne(() => Address, {
    fieldName: 'address_id',
    nullable: true,
    deleteRule: 'cascade',
    updateRule: 'cascade',
  })
  address?: Address;

  @ApiPropertyOptional({
    description: 'Address foreign key (virtual field)',
    example: 42,
  })
  @Property({ persist: false })
  get addressId(): number | null {
    return this.address?.id ?? null;
  }

  @ApiProperty({
    description: 'Name of the supermarket (for sellers)',
    example: 'Market El Baraka',
  })
  @Property({ nullable: true })
  supermarketName?: string;

  @ApiPropertyOptional({
    description: 'Profile picture URL',
    example: 'https://cdn.example.com/avatars/user123.jpg',
  })
  @Property({ nullable: true })
  profilePic?: string;

  @ApiProperty({
    description: 'Role of the user',
    enum: USER_ROLE_VALUES,
    example: 'ADMIN',
  })
  @Enum({ items: () => USER_ROLE_VALUES, default: USER_ROLES.SUPERMARKET })
  role?: UserRole;

  @ApiProperty({
    description: 'List of favorite products',
    type: () => [FavProduct],
  })
  @OneToMany(() => FavProduct, (favProduct) => favProduct.user)
  favoriteProducts = new Collection<FavProduct>(this);

  @ApiProperty({
    description: 'List of products added by the user (if seller)',
    type: () => [Product],
  })
  @OneToMany(() => Product, (product) => product.seller)
  products = new Collection<Product>(this);
}
