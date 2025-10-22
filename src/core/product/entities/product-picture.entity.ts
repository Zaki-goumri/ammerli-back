import { BaseEntity } from 'src/common/entities/base.entity';
import { Column, JoinColumn, ManyToOne, Relation } from 'typeorm';
import { Product } from './product.entity';
import { ApiProperty } from '@nestjs/swagger';

export class ProductPictutre extends BaseEntity {
  @ManyToOne(() => Product, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'productId' })
  product: Relation<Product>;

  @ApiProperty({
    description: 'The ID of the product associated with this picture',
    example: 1,
  })
  @Column({ type: 'int' })
  productId: number;

  @ApiProperty({
    description: 'The URL of the product picture',
    example: 'https://example.com/product-picture.jpg',
  })
  @Column({ type: 'varchar', length: 500 })
  url: string;
}
