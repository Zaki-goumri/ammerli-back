import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class SendNotificationDto {
  @IsString()
  @ApiProperty({
    description: 'FCM device token',
    example:
      'e1IBNvDp3xDTixSuX0PmHi:APA91bEwHP-Vc5TyCCpP9W28lHJ-MRcLVNGGW1Q_r8xJH1vnmO77b9pUzLLckc7BTV05u1_nn6dWBPE8zPMADJS-bEc4owee7198ILyDKef9sxT0eUmdLw0',
  })
  token: string;
  @IsString()
  @ApiProperty({
    description: 'Notification title',
    example: 'Hello User',
  })
  title: string;
  @IsString()
  @ApiProperty({
    description: 'Notification body',
    example: 'This is a test notification sent via FCM',
  })
  body: string;
}
