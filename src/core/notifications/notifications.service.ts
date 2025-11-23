import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Notification } from './entities/notification.entity';
import { Repository, LessThan } from 'typeorm';
import { PaginationQueryDto } from 'src/common/dtos/pagination.dto';
import { Language, Token } from './entities/token.entity';
import { InjectQueue } from '@nestjs/bullmq';
import { QUEUE_NAME } from 'src/common/constants/queues';
import { Queue } from 'bullmq';
import { NotificationType } from './enums/notification-type.enum';
import { NOTIFICATION_JOBS } from 'src/common/constants/jobs';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SendNotificationResponseDto } from './dto/send-notification-response.dto';
import { CreateTokenDto } from './dto/create-token.dto';
import { I18nService } from 'nestjs-i18n';

const OLD_NOTIFICATION_DELETE_DAYS = 7;

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepo: Repository<Notification>,
    @InjectRepository(Token)
    private readonly tokenRepo: Repository<Token>,
    @InjectQueue(QUEUE_NAME.NOTIFICATION)
    private readonly notificationQueue: Queue,
    private readonly i18nService: I18nService,
  ) {}

  logger = new Logger(NotificationsService.name);

  /**
   * Cron job to delete old notifications that are older than one week and have been read.
   * Runs every week.
   */
  @Cron(CronExpression.EVERY_WEEK)
  async handleCron() {
    this.logger.log({
      message: 'Running cron job to delete old notifications',
      daysOld: OLD_NOTIFICATION_DELETE_DAYS,
      context: 'Notifications',
    });
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - OLD_NOTIFICATION_DELETE_DAYS);
    await this.notificationRepo.delete({
      createdAt: LessThan(oneWeekAgo),
      isRead: true,
    });
    this.logger.log({
      message: 'Old notifications deleted',
      context: 'Notifications',
    });
  }

  /**
   * Creates a new notification record in the database.
   * @param dto - The data transfer object containing notification details.
   * @returns A promise that resolves to the newly created notification.
   */
  create(dto: CreateNotificationDto) {
    const notification = this.notificationRepo.create(dto);
    return this.notificationRepo.save(notification);
  }

  /**
   * Retrieves a paginated list of notifications.
   * @param paginationaQuery - The pagination query parameters.
   * @returns A promise that resolves to a list of notifications.
   */
  async findAll(
    paginationaQuery: PaginationQueryDto,
    userId: number,
    lang: Language,
  ) {
    const { limit, page } = paginationaQuery;
    const notification = await this.notificationRepo.find({
      skip: (page - 1) * limit,
      take: limit,
      where: { receiverId: userId },
      order: { createdAt: 'DESC' },
    });
    return notification.map((notif) => {
      const translated = this.translateNotification(
        lang,
        notif.title,
        notif.body,
        notif.meta,
      );
      return {
        ...notif,
        title: translated.title,
        body: translated.body,
      };
    });
  }

  /**
   * Retrieves a single notification by its ID.
   * @param id - The ID of the notification to retrieve.
   * @returns A promise that resolves to the notification, or undefined if not found.
   */
  findOne(id: number) {
    return this.notificationRepo.findOne({ where: { id } });
  }

  /**
   * Marks a list of notifications as read.
   * @param ids - An array of notification IDs to mark as read.
   * @returns A promise that resolves when the update is complete.
   */
  async updateRead(ids: number[]) {
    await this.notificationRepo
      .createQueryBuilder()
      .update()
      .set({ isRead: true })
      .whereInIds(ids)
      .execute();
  }

  /**
   * Removes a notification by its ID.
   * @param id - The ID of the notification to remove.
   * @param userId - The ID of the user attempting to remove the notification (for authorization, though not used in current implementation).
   * @returns A promise that resolves when the removal is complete.
   */
  async remove(id: number, userId: number) {
    await this.notificationRepo.delete({ id });
  }

  /**
   * Saves a new notification record to the database.
   * @param title - The title of the notification.
   * @param body - The body/content of the notification.
   * @param receiverId - The ID of the user who will receive the notification.
   * @param type - The type of the notification.
   * @returns A promise that resolves to the saved notification record.
   */
  async saveNotificationRecord(
    title: string,
    body: string,
    receiverId: number,
    type: NotificationType,
    data: Record<string, any>,
  ): Promise<Notification> {
    const createNotificationDto: CreateNotificationDto = {
      title,
      body,
      receiverId,
      type,
      isRead: false,
      meta: data,
    };
    return this.create(createNotificationDto);
  }

  // FcmTokenService methods
  /**
   * Registers an FCM token for a specific user.
   * @param dto - The data transfer object containing the FCM token and device type.
   * @param userId - The ID of the user registering the token.
   * @returns A promise that resolves to a success message.
   */
  async registerToken(
    dto: CreateTokenDto,
    userId: number,
  ): Promise<{ message: string }> {
    const token = this.tokenRepo.create({
      userId,
      ...dto,
    });
    await this.tokenRepo.save(token);
    this.logger.log({
      message: 'FCM token registered',
      userId,
      deviceType: dto.os,
      context: 'Notifications',
    });
    return { message: 'Token registered successfully' };
  }

  /**
   * Retrieves all active FCM tokens for a given user.
   * @param userId - The ID of the user.
   * @returns A promise that resolves to an array of FCM tokens.
   * @throws {BadRequestException} If no active tokens are found for the user.
   */
  async getActiveTokensForUser(userId: number): Promise<
    {
      token: string;
      lang: string;
    }[]
  > {
    const tokens = await this.tokenRepo.find({ where: { userId } });
    if (!tokens || tokens.length === 0) {
      throw new BadRequestException('No active tokens found for the user');
    }
    return tokens.map((token) => {
      return { token: token.fcmToken, lang: token.lang };
    });
  }

  /**
   * Revokes (deletes) a specific FCM token.
   * @param token - The FCM token string to revoke.
   * @returns A promise that resolves when the token is deleted.
   */
  async revokeToken(token: string): Promise<void> {
    await this.tokenRepo.delete({ fcmToken: token });
  }

  /**
   * Revokes all FCM tokens for a specific user (logout all devices).
   * @param userId - The ID of the user.
   * @returns A promise that resolves when all tokens are deleted.
   */
  async revokeAllTokensForUser(userId: number): Promise<void> {
    await this.tokenRepo.delete({ userId });
  }

  /**
   * Handles user logout by removing FCM token(s).
   * If fcmToken is provided, removes only that token.
   * If fcmToken is not provided, removes all tokens for the user.
   * @param userId - The ID of the user logging out.
   * @param fcmToken - Optional specific FCM token to remove.
   * @returns A promise that resolves to a success message.
   */
  async deleteToken(fcmToken: string): Promise<{ message: string }> {
    await this.revokeToken(fcmToken);
    this.logger.log({
      message: 'Logged out from device',
      context: 'Notifications',
    });
    return { message: 'Logged out from device successfully' };
  }

  // FcmService methods
  /**
   * Adds a notification job to the queue for sending.
   * @param title - The title of the notification.
   * @param body - The body/content of the notification.
   * @param userId - The ID of the user to whom the notification is to be sent.
   * @param type - The type of the notification.
   * @returns A promise that resolves to a success response indicating the job was added.
   */
  async sendNotification(
    titleKey: string,
    bodyKey: string,
    userId: number,
    type: NotificationType,
    data?: Record<string, any>,
  ): Promise<SendNotificationResponseDto> {
    await this.notificationQueue.add(NOTIFICATION_JOBS.SEND_NOTIFICATION, {
      titleKey,
      bodyKey,
      userId,
      type,
      translationArgs: data,
    });
    this.logger.log({
      message: 'Notification job added to queue',
      userId,
      titleKey,
      type,
      context: 'Notifications',
    });
    return { success: true, message: 'Notification job added to queue' };
  }

  translateNotification(
    lang: Language,
    titleKey: string,
    bodyKey: string,
    data?: Record<string, any>,
  ) {
    const title = this.i18nService.translate(titleKey, {
      lang: lang as string,
      args: data,
    });
    const body = this.i18nService.translate(bodyKey, {
      lang: lang as string,
      args: data,
    });
    return { title, body };
  }
  //TODO: remove it
  async sendOtpViaNotification(token: string, otp: string): Promise<void> {
    const title = this.i18nService.translate('notifications.otp.title');
    const body = this.i18nService.translate('notifications.otp.body', {
      args: { otp },
    });
    await this.notificationQueue.add(NOTIFICATION_JOBS.SEND_TEST_NOTIFICATION, {
      title,
      body,
      token,
    });
  }

  async updateLanguage(
    userId: number,
    fcmToken: string,
    lang: Language,
  ): Promise<void> {
    try {
      const update = await this.tokenRepo.update(
        { userId, fcmToken },
        { lang },
      );
      if (update.affected === 0) {
        throw new Error('No token updated');
      }
      this.logger.log({
        message: 'Updated language for FCM token',
        userId,
        fcmToken,
        context: 'Notifications',
      });
    } catch (error) {
      this.logger.error({
        message: 'Failed to update language for FCM token',
        userId,
        fcmToken,
        error: error.message,
        context: 'Notifications',
      });
      throw new BadRequestException('You dont have this token registered');
    }
    return;
  }
}
