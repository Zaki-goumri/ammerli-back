
import { ApiProperty } from '@nestjs/swagger';
import { AddressDto } from './address.dto';

export class GetMeDto {
  @ApiProperty({
    example: 1,
    description: 'The unique identifier of the user.',
  })
  id: number;

  @ApiProperty({
    example: 'John Doe',
    description: 'The name of the user.',
  })
  name: string;

  @ApiProperty({
    example: '1234567890',
    description: 'The phone number of the user.',
  })
  phoneNumber: string;

  @ApiProperty({
    example: 'https://example.com/profile.jpg',
    description: 'The URL of the user profile picture.',
    nullable: true,
  })
  profilePic: string | null;

  @ApiProperty({
    example: 'My Supermarket',
    description: 'The name of the user supermarket.',
    nullable: true,
  })
  supermarketName: string | null;

  @ApiProperty({
    type: () => [AddressDto],
    description: 'The list of addresses associated with the user.',
  })
  addresses: AddressDto[];
}
