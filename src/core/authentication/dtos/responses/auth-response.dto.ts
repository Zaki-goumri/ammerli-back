import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { User } from 'src/core/user/entities/user.entity';

export class AuthResponseDto {
  @ApiProperty({
    description: 'The access token for the user',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken: string;
  @ApiPropertyOptional({
    description: 'The refresh token for the user',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  refreshToken?: string;
  @ApiPropertyOptional({
    description: 'The user object containing user details',
    type: () => User,
  })
  user?: User;
}
