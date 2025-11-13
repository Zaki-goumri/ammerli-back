import {
  Entity,
  Column,
  ManyToOne,
  Relation,
  DeleteDateColumn,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from '../../../common/entities/base.entity';

@Index(['id', 'label'], {
  unique: true,
  where: '"deletedAt" is NULL',
})
@Entity('categories')
export class Category extends BaseEntity {
  @ApiProperty({
    description: 'The label of the category',
    example: 'Electronics',
  })
  @Column()
  label: string;

  @ApiProperty({
    description: 'The object name of the category picture in object storage.',
    example: 'categories/1678886400000-random-bytes-picture.jpg',
  })
  @Column()
  pictureUrl: string;

  @Column({ nullable: true })
  parentCategoryId?: number;

  @ManyToOne(() => Category, (category) => category.id, { nullable: true })
  parentCategory?: Relation<Category>;

  @DeleteDateColumn()
  deletedAt?: Date;
}
