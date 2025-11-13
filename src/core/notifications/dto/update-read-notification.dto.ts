import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsPositive, IsArray } from 'class-validator';

export class UpdateReadNotificationsDto {
  @ApiProperty({
    example: [1, 2, 3],
    description: 'Array of notification IDs to mark as read',
  })
  @IsNumber({}, { each: true })
  @IsPositive({ each: true })
  @IsArray()
  ids: number[];
}
