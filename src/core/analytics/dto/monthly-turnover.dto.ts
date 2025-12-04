import { ApiProperty } from '@nestjs/swagger';

export class MonthlyTurnoverItemDto {
  @ApiProperty({
    description: 'Month abbreviation',
    example: 'Jan',
    enum: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  })
  month: string;

  @ApiProperty({
    description: 'Turnover amount for the month',
    example: 50000.75,
  })
  turnover: number;
}

export class MonthlyTurnoverRawResult {
  year: string;
  month_number: string;
  turnover: string;
}
