import { PartialType } from '@nestjs/swagger';
import { CreateProductDto } from './create.dto';
import { Transform } from 'class-transformer';
import { parseIntArrayQueryParam } from 'src/common/utils';
import { IsNumber, IsOptional } from 'class-validator';

export class UpdateProductDto extends PartialType(CreateProductDto) {
  @Transform(({ value }) => {
    return parseIntArrayQueryParam(value as string);
  })
  @IsOptional()
  @IsNumber({}, { each: true })
  picturesToDelete?: number[];
}
