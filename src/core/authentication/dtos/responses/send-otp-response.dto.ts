import { ApiProperty } from '@nestjs/swagger';

export class SendOtpResDto {
  @ApiProperty({ example: 'OTP sent successfully' })
  message: string;
}
