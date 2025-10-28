import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString } from 'class-validator';
import {
  NOTIFICATION_TYPE,
  NOTIFICATION_TYPE_VALUES,
  NotificationType,
} from '../enums/notification-type.enum';

export class SendNotificationDto {
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

  @IsEnum(NOTIFICATION_TYPE_VALUES)
  @ApiProperty({
    description: 'Notification type',
    enum: NOTIFICATION_TYPE_VALUES,
    example: NOTIFICATION_TYPE.ORDERS,
  })
  type: NotificationType;
}
