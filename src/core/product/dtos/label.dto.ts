import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateLabelDto {
  @ApiProperty({ description: 'Label name', example: 'Electronics' })
  @IsString()
  label: string;
}
