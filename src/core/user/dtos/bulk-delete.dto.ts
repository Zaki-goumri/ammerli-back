import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsArray, IsNotEmpty, IsNumber } from 'class-validator';
import { parseIntArrayQueryParam } from 'src/common/utils/query.utils';

export class BulkDeleteUserDto {
  @ApiProperty({
    description: 'Array of user IDs to be deleted',
    example: [1, 2, 3],
    type: [Number],
  })
  @Transform(({ value }) => parseIntArrayQueryParam(value))
  @IsArray()
  @IsNumber({}, { each: true })
  @IsNotEmpty()
  userIds: number[];
}
