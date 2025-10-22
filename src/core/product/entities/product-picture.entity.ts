import { BaseEntity } from 'src/common/entities/base.entity';
import { Column, Index, JoinColumn, ManyToOne, Relation } from 'typeorm';
import { Product } from './product.entity';
import { ApiProperty } from '@nestjs/swagger';

@Index('IDX_UNIQUE_MAIN_PICTURE', ['productId', 'isMain'], {
  unique: true,
  where: '"isMain" = TRUE',
})
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
  @Column({ type: 'varchar', length: 500, nullable: true })
  url?: string;

  @ApiProperty({
    description:
      'Indicates whether this picture is the main picture for the product',
    example: true,
  })
  @Column({ type: 'boolean', default: false })
  isMain: boolean;
  //TODO: change status to enum
  @ApiProperty({
    description: 'upload status of the picture',
    example: 'completed',
  })
  @Column({ type: 'varchar', length: 50, default: 'completed' })
  status: string;
}
