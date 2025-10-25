import { Entity, Column, ManyToOne, Relation } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('categories')
export class Category extends BaseEntity {
  @ApiProperty({
    description: 'The label of the category',
    example: 'Electronics',
  })
  @Column({ unique: true })
  label: string;

  @ApiProperty({
    description: 'The picture URL of the category',
    example: 'https://example.com/category-picture.jpg',
  })
  @Column()
  pictureUrl: string;

  @Column({ nullable: true })
  parentCategoryId?: number;

  @ManyToOne(() => Category, (category) => category.id, { nullable: true })
  parentCategory?: Relation<Category>;
}
