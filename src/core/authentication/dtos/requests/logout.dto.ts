import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

/**
 * @class LogoutDto
 * @description DTO for user logout with optional FCM token removal
 */
export class LogoutDto {
  @ApiPropertyOptional({
    description:
      'FCM token to revoke on logout (if not provided, all tokens for user will be removed)',
    example: 'bk3RNwTe3H0:CI2k_HHwgIpoDKCIZvvDMExUdFQ3P1...',
  })
  @IsOptional()
  @IsString()
  fcmToken: string;
}
