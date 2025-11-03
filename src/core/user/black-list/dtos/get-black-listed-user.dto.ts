import { ApiProperty } from '@nestjs/swagger';

export class GetBlackListedUserDto {
  @ApiProperty({ description: 'The unique identifier of the blacklist entry' })
  id: number;

  @ApiProperty({ description: 'The ID of the blacklisted user' })
  userId: number;

  @ApiProperty({ description: 'The name of the blacklisted user' })
  name: string;

  @ApiProperty({ description: 'The phone number of the blacklisted user' })
  phoneNumber: string;
}
