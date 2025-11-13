import { ApiProperty } from '@nestjs/swagger';

export class SendNotificationResponseDto {
  @ApiProperty({
    description:
      'Indicates if the notification job was successfully added to the queue.',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'A message describing the outcome.',
    example: 'Notification job added to queue',
  })
  message: string;
}
