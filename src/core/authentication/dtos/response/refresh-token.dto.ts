import { ApiProperty } from '@nestjs/swagger';
import { UserDto } from 'src/core/user/dtos/response/user.dto';

export class AuthResDto {
  @ApiProperty({
    description: 'The new access token.',
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicGhvbmVOdW1iZXIiOiIxMjM0NTY3ODkwIiwicm9sZSI6InVzZXIiLCJpYXQiOjE2MjU4NjQwMDAsImV4cCI6MTYyNTg2NDYwMH0.signature',
  })
  accessToken: string;

  @ApiProperty({
    description: 'The new refresh token.',
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsInBob25lTnVtYmVyIjoiMTIzNDU2Nzg5MCIsInJvbGUiOiJ1c2VyIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE2MjU4NjQwMDAsImV4cCI6MTYyNjQ2ODgwMH0.signature',
  })
  refreshToken: string | null;

  @ApiProperty({
    description: 'The user information.',
    type: () => UserDto,
  })
  user: UserDto | null;
}
