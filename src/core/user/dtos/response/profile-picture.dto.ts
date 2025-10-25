
import { ApiProperty } from '@nestjs/swagger';

export class ProfilePictureDto {
  @ApiProperty({
    example: 'https://example.com/profile.jpg',
    description: 'The URL of the user profile picture.',
  })
  profilePic: string;
}
