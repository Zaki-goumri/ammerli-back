import { ApiProperty } from '@nestjs/swagger';
import { CategoryResDto } from './category.res.dto';

export class GetAllCategoriesDto {
  @ApiProperty({ type: [CategoryResDto] })
  mainCategories: CategoryResDto[];

  @ApiProperty({ type: [CategoryResDto] })
  subCategories: CategoryResDto[];
}
