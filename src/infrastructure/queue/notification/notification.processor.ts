import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { QUEUE_NAME } from 'src/common/constants/queues';
import { Logger } from '@nestjs/common';
import { NOTIFICATION_JOBS } from 'src/common/constants/jobs';
import { NotificationsService } from 'src/core/notifications/notifications.service';
import { FirebaseService } from 'src/infrastructure/firebase/firebase.service';
import { NotificationType } from 'src/core/notifications/enums/notification-type.enum';

interface SendNotificationJob {
  title: string;
  body: string;
  userId: number;
  type: NotificationType;
}

class NotificationMessage {
  notification: {
    title: string;
    body: string;
  };
  token: string;
  data?: {
    type: NotificationType;
  };
}

@Processor(QUEUE_NAME.NOTIFICATION)
export class NotificationProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationProcessor.name);

  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly firebaseService: FirebaseService,
  ) {
    super();
  }

  async process(job: Job<SendNotificationJob, any, string>): Promise<any> {
    this.logger.log(`Processing job ${job.id} of type ${job.name}`);
    switch (job.name) {
      case NOTIFICATION_JOBS.SEND_NOTIFICATION:
        this.logger.log(`Processing log event job: ${job.id}`);
        await this.handleSendingNotification(job.data);
        return Promise.resolve({
          message: 'Bulk notification job processed',
          jobId: job.id,
        });
      case NOTIFICATION_JOBS.SEND_BULK_NOTIFICATION:
        throw new Error('Method not implemented.');
      default:
        return Promise.resolve({
          message: 'Unknown job processed',
          jobId: job.id,
        });
    }
  }

  sendNotificationToOneDevice(message: NotificationMessage): Promise<string> {
    this.logger.log(`Sending notification to token: ${message.token}`);
    return this.firebaseService.getFcm().send(message);
  }

  async handleSendingNotification(data: SendNotificationJob): Promise<void> {
    this.logger.log('Handling sending notification...');
    const tokens = await this.notificationsService.getActiveTokensForUser(
      data.userId,
    );
    const messages = tokens.map((token) => ({
      notification: {
        title: data.title,
        body: data.body,
      },
      token,
      data: {
        type: data.type,
      },
    }));

    await Promise.allSettled(
      messages.map((message) => this.sendNotificationToOneDevice(message)),
    );
    this.logger.log('Sending notification handled.');
  }

  @OnWorkerEvent('completed')
  async onCompleted(job: Job<SendNotificationJob>) {
    this.logger.log(`Job completed: ${job.id}`);
    const { title, body, userId, type } = job.data;
    await this.notificationsService.saveNotificationRecord(
      title,
      body,
      userId,
      type,
    );
    this.logger.log(`Notification saved to DB for job ${job.id}`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job) {
    this.logger.log(`Job failed: ${job.id}`);
  }
}
