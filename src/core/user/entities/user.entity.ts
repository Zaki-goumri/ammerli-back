import { Entity, Column, OneToMany, DeleteDateColumn, Index } from 'typeorm';
import { Product } from '../../product/entities/product.entity';
import { Address } from './address.entity';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  USER_ROLE_VALUES,
  UserRole,
  USER_ROLES,
} from 'src/common/enums/user-role.enum';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('users')
@Index('IDX_UNIQUE_PHONE_ACTIVE', ['phoneNumber'], {
  unique: true,
  where: '"deletedAt" IS NULL',
})
export class User extends BaseEntity {
  @ApiProperty({
    description: 'User phone number',
    example: '+213551234567',
  })
  @Column()
  phoneNumber: string;

  @ApiPropertyOptional({
    description: 'Full name of the user',
    example: 'John Doe',
  })
  @Column({ nullable: true })
  name?: string;

  @ApiPropertyOptional({
    description: 'Linked addresses of the user',
    type: () => [Address],
  })
  @OneToMany(() => Address, (address) => address.user, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  addresses?: Address[];

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
    description: 'List of products added by the user (if seller)',
    type: () => [Product],
  })
  @OneToMany(() => Product, (product) => product.seller)
  products: Product[];

  @Column({ default: false })
  isRegistered: boolean;

  @DeleteDateColumn()
  deletedAt?: Date;
}
