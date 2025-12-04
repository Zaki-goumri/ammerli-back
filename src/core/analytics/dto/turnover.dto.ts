import { ApiProperty } from '@nestjs/swagger';

export class TurnoverDto {
  @ApiProperty({
    description: 'Total turnover amount',
    example: 125000.5,
  })
  turnover: number;
}
