import { ApiProperty } from '@nestjs/swagger';

export class ParentCategoryDto {
  @ApiProperty()
  label: string;

  @ApiProperty()
  pictureUrl: string;

  @ApiProperty()
  id: number;
}

export class SubCategoryResDto {
  @ApiProperty()
  label: string;

  @ApiProperty()
  id: number;

  @ApiProperty()
  pictureUrl: string;

  @ApiProperty({ type: ParentCategoryDto })
  parentCategory: ParentCategoryDto;
}
