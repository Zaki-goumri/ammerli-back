import { SendNotificationDto } from 'src/core/notifications/dto/send-notification.dto';

export class SendNotificationDtoWithUserId extends SendNotificationDto {
  userId: number;
}
