import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsNumber } from 'class-validator';

export class BulkDeleteUserDto {
  @ApiProperty({
    description: 'Array of user IDs to be deleted',
    example: [1, 2, 3],
    type: [Number],
  })
  @IsArray()
  @IsNumber({}, { each: true })
  @IsNotEmpty()
  userIds: number[];
}
