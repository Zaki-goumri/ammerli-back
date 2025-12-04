import { ApiProperty } from '@nestjs/swagger';
import { DayAnalyticsDto } from './day-analytics.dto';
import { TurnoverDto } from './turnover.dto';
import { ActiveSupermarketsDto } from './active-supermarkets.dto';

export class DailyStatsDto {
  @ApiProperty({
    description: 'Daily order statistics',
    type: DayAnalyticsDto,
  })
  orders: DayAnalyticsDto;

  @ApiProperty({
    description: 'Revenue statistics',
    type: TurnoverDto,
  })
  revenue: TurnoverDto;

  @ApiProperty({
    description: 'Active supermarkets statistics',
    type: ActiveSupermarketsDto,
  })
  supermarkets: ActiveSupermarketsDto;

  @ApiProperty({
    description: 'Delivered orders count statistics',
    type: DayAnalyticsDto,
  })
  deliveredOrders: DayAnalyticsDto;
}
