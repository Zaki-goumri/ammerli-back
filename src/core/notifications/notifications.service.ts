import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Notification } from './entities/notification.entity';
import { Repository, LessThan } from 'typeorm';
import { PaginationQueryDto } from 'src/common/dtos/pagination.dto';
import { Token } from './entities/token.entity';
import { InjectQueue } from '@nestjs/bullmq';
import { QUEUE_NAME } from 'src/common/constants/queues';
import { Queue } from 'bullmq';
import { NotificationType } from './enums/notification-type.enum';
import { NOTIFICATION_JOBS } from 'src/common/constants/jobs';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepo: Repository<Notification>,
    @InjectRepository(Token)
    private readonly tokenRepo: Repository<Token>,
    @InjectQueue(QUEUE_NAME.NOTIFICATION)
    private readonly notificationQueue: Queue,
  ) {}

  logger = new Logger(NotificationsService.name);

  @Cron(CronExpression.EVERY_WEEK)
  async handleCron() {
    this.logger.log(
      'Running cron job to delete old notifications than one week',
    );
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    await this.notificationRepo.delete({
      createdAt: LessThan(oneWeekAgo),
      isRead: true,
    });
    this.logger.log('Old notifications deleted');
  }

  // NotificationsService methods
  create(dto: CreateNotificationDto) {
    const notification = this.notificationRepo.create(dto);
    return this.notificationRepo.save(notification);
  }

  findAll(paginationaQuery: PaginationQueryDto) {
    const { limit, page } = paginationaQuery;
    return this.notificationRepo.find({
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });
  }

  findOne(id: number) {
    return this.notificationRepo.findOne({ where: { id } });
  }

  async updateRead(ids: number[], userId: number) {
    for (const id of ids) {
      await this.notificationRepo.update(
        { id, receiverId: userId },
        {
          isRead: true,
        },
      );
    }
  }

  async remove(id: number, userId: number) {
    await this.notificationRepo.delete({ id, receiverId: userId });
  }

  async saveNotificationRecord(
    title: string,
    body: string,
    receiverId: number,
    type: NotificationType,
  ): Promise<Notification> {
    const createNotificationDto: CreateNotificationDto = {
      title,
      body,
      receiverId,
      type,
      isRead: false, // Default to unread
    };
    return this.create(createNotificationDto);
  }

  // FcmTokenService methods
  async registerToken(
    dto: CreateNotificationDto,
    userId: number,
  ): Promise<{ message: string }> {
    const token = this.tokenRepo.create({
      userId,
      ...dto,
    });
    await this.tokenRepo.save(token);
    return { message: 'Token registered successfully' };
  }

  async getActiveTokensForUser(userId: number): Promise<string[]> {
    const tokens = await this.tokenRepo.find({ where: { userId } });
    if (!tokens || tokens.length === 0) {
      throw new BadRequestException('No active tokens found for the user');
    }
    return tokens.map((token) => token.fcmToken);
  }

  async revokeToken(token: string): Promise<void> {
    await this.tokenRepo.delete({ fcmToken: token });
  }

  // FcmService methods
  async sendNotification(
    title: string,
    body: string,
    userId: number,
    type: NotificationType,
  ): Promise<any> {
    await this.notificationQueue.add(NOTIFICATION_JOBS.SEND_NOTIFICATION, {
      title,
      body,
      userId,
      type,
    });
    return { success: true, message: 'Notification job added to queue' };
  }
}
