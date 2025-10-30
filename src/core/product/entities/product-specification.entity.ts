import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  PrimaryColumn,
  Relation,
} from 'typeorm';
import { Product } from './product.entity';
import { Specification } from './specification.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity('product_specifications')
export class ProductSpecification {
  @PrimaryColumn()
  productId: number;

  @PrimaryColumn()
  specificationId: number;

  @ManyToOne(() => Specification, (specification) => specification.id, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'specificationId' })
  specification: Relation<Specification>;

  @ApiProperty({
    description: 'The value of the specification for the product',
    example: '10',
  })
  @Column()
  value: string;
}
