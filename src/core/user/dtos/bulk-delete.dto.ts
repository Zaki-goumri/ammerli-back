import { Transform } from 'class-transformer';
import { IsArray, IsNotEmpty, IsNumber } from 'class-validator';
import { parseIntArrayQueryParam } from 'src/common/utils/query.utils';

export class BulkDeleteUserDto {
  @Transform(({ value }) => parseIntArrayQueryParam(value))
  @IsArray()
  @IsNumber({}, { each: true })
  @IsNotEmpty()
  userIds: number[];
}
