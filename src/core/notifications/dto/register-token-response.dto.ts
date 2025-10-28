import { ApiProperty } from '@nestjs/swagger';

export class RegisterTokenResponseDto {
  @ApiProperty({
    description: 'A message indicating the result of the token registration.',
    example: 'Token registered successfully',
  })
  message: string;
}
