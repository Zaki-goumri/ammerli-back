import { BaseEntity } from 'src/common/entities/base.entity';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  Relation,
} from 'typeorm';
import { Product } from './product.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity('product_pictures')
@Index(['productId', 'isMain', 'url'], {
  unique: true,
  where: '"isMain" = TRUE',
})
export class ProductPicture extends BaseEntity {
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
    description: 'The object name of the product picture in object storage.',
    example: 'products/1678886400000-random-bytes-picture.jpg',
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
