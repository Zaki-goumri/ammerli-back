import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches } from 'class-validator';

export class RequestAccountDeletionDto {
  @ApiProperty({
    description: 'Phone number in Algerian format',
    example: '+213550123456',
  })
  @IsString()
  @Matches(/^\+2135[0-9]{8}$/, {
    message: 'Phone number must be in Algerian format: +213XXXXXXXXX',
  })
  phoneNumber: string;
}
