import { ApiProperty } from '@nestjs/swagger';

export class DayAnalyticsDto {
  @ApiProperty({
    description: 'Number of orders for the current day',
    example: 25,
  })
  count: number;

  @ApiProperty({
    description: 'Percentage change compared to yesterday',
    example: 15.5,
  })
  percentageChange: number;
}
