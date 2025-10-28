import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { parseIntArrayQueryParam } from 'src/common/utils/query.utils';
import { IsNumber, IsPositive, IsArray } from 'class-validator';

export class UpdateReadNotificationsDto {
  @ApiProperty({
    example: [1, 2, 3],
    description: 'Array of notification IDs to mark as read',
  })
  @Transform(({ value }) => parseIntArrayQueryParam(value))
  @IsNumber({}, { each: true })
  @IsPositive({ each: true })
  @IsArray()
  ids: number[];
}
