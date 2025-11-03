import { ApiProperty } from '@nestjs/swagger';

export class BlackListDto {
  @ApiProperty({
    example: 1,
    description: 'The unique identifier of the blacklisted entry.',
  })
  id: number;

  @ApiProperty({
    example: 1,
    description: 'The ID of the blacklisted user.',
  })
  userId: number;
}
