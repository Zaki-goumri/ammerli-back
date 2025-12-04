import { ApiProperty } from '@nestjs/swagger';

export class ActiveSupermarketsDto {
  @ApiProperty({
    description: 'Number of active supermarkets today',
    example: 45,
  })
  todayActiveSuperMarkets: number;

  @ApiProperty({
    description: 'Percentage change compared to yesterday',
    example: 5.2,
  })
  percentageChange: number;
}
