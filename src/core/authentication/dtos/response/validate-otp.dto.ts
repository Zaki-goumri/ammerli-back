import { ApiProperty, PartialType } from '@nestjs/swagger';
import { AuthResDto } from './refresh-token.dto';

export class ValidateOtpDto extends PartialType(AuthResDto) {
  @ApiProperty({
    example: true,
    description: 'Indicates if the user is registered.',
  })
  isRegistered: boolean;
}
