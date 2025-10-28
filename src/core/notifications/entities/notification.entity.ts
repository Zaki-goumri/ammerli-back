import { Column, Entity, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { ApiProperty } from '@nestjs/swagger';
import { User } from 'src/core/user/entities/user.entity';

/**
 * @fileoverview Defines the Notification entity.
 * @module core/notifications/entities/notification
 */

@Entity('notifications')
export class Notification extends BaseEntity {
  @ApiProperty({
    description: 'The title of the notification.',
    example: 'New Message',
  })
  @Column()
  title: string;

  @ApiProperty({
    description: 'The body of the notification.',
    example: 'You have a new message from John Doe.',
  })
  @Column()
  body: string;

  @ApiProperty({
    description: 'The ID of the user who will receive the notification.',
    example: 1,
  })
  @Column()
  receiverId: number;

  @ApiProperty({
    description: 'Additional metadata for the notification.',
    type: 'object',
    additionalProperties: true,
    example: { orderId: 123 },
  })
  @Column({ type: 'jsonb', nullable: true })
  meta?: Record<string, any>;

  @ManyToOne(() => User, (user) => user.notifications, { onDelete: 'CASCADE' })
  receiver: User;

  @Column()
  isRead: boolean;
}
