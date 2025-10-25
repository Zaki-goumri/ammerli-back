
import { ApiProperty } from '@nestjs/swagger';

export class MessageDto {
  @ApiProperty({
    example: 'User deleted successfully',
    description: 'A success message.',
  })
  message: string;
}
