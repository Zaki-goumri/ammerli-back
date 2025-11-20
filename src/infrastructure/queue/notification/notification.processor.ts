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

class TestNotificationJob {
  title: string;
  body: string;
  token: string;
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

  async process(
    job: Job<SendNotificationJob | TestNotificationJob, any, string>,
  ): Promise<any> {
    this.logger.log(`Processing job ${job.id} of type ${job.name}`);
    switch (job.name) {
      case NOTIFICATION_JOBS.SEND_NOTIFICATION:
        this.logger.log({
          message: 'Processing notification job',
          jobId: job.id,
          context: 'NotificationProcessor',
        });
        await this.handleSendingNotification(job.data as SendNotificationJob);
        return Promise.resolve({
          message: 'Notification job processed',
          jobId: job.id,
        });

      case NOTIFICATION_JOBS.SEND_TEST_NOTIFICATION: {
        this.logger.log(`Processing test notification job: ${job.id}`);
        const { title, body, token } = job.data as TestNotificationJob;
        const message: NotificationMessage = {
          notification: {
            title,
            body,
          },
          token,
        };
        const response = await this.sendNotificationToOneDevice(message);
        return Promise.resolve({
          message: 'Test notification sent',
          jobId: job.id,
          response,
        });
      }

      default:
        this.logger.warn(`Unknown job type: ${job.name}`);
        return Promise.resolve({
          message: 'Unknown job processed',
          jobId: job.id,
        });
    }
  }

  sendNotificationToOneDevice(message: NotificationMessage): Promise<string> {
    this.logger.debug({
      message: 'Sending notification to token',
      tokenPrefix: message.token.substring(0, 20),
      context: 'NotificationProcessor',
    });
    return this.firebaseService.getFcm().send(message);
  }

  async handleSendingNotification(data: SendNotificationJob): Promise<void> {
    this.logger.log({
      message: 'Handling sending notification',
      userId: data.userId,
      title: data.title,
      type: data.type,
      context: 'NotificationProcessor',
    });
    const tokens = await this.notificationsService.getActiveTokensForUser(
      data.userId,
    );

    if (tokens.length === 0) {
      this.logger.warn(`No active tokens found for user ${data.userId}`);
      return;
    }

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

    const results = await Promise.allSettled(
      messages.map((message) => this.sendNotificationToOneDevice(message)),
    );

    // Auto-cleanup invalid FCM tokens
    const invalidTokens: string[] = [];
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        const error = result.reason;
        // Check if the error is related to invalid token
        if (this.isInvalidTokenError(error)) {
          invalidTokens.push(tokens[index]);
          this.logger.warn(
            `Invalid FCM token detected: ${tokens[index].substring(0, 20)}...`,
          );
        }
      }
    });

    // Remove invalid tokens from database
    if (invalidTokens.length > 0) {
      await Promise.all(
        invalidTokens.map((token) =>
          this.notificationsService.revokeToken(token),
        ),
      );
      this.logger.log(
        `Auto-removed ${invalidTokens.length} invalid FCM token(s)`,
      );
    }

    this.logger.log({
      message: 'Sending notification handled',
      totalTokens: tokens.length,
      invalidTokens: invalidTokens.length,
      context: 'NotificationProcessor',
    });
  }

  /**
   * Checks if the error is related to an invalid FCM token.
   * @param error - The error object from Firebase.
   * @returns True if the error indicates an invalid token.
   */
  private isInvalidTokenError(error: any): boolean {
    const errorCode = error?.code || error?.errorInfo?.code;
    const invalidErrorCodes = [
      'messaging/invalid-registration-token',
      'messaging/registration-token-not-registered',
      'messaging/invalid-argument',
    ];
    return invalidErrorCodes.includes(errorCode);
  }

  @OnWorkerEvent('completed')
  async onCompleted(job: Job<SendNotificationJob | TestNotificationJob>) {
    // Skip saving test notifications to database
    if (job.name === NOTIFICATION_JOBS.SEND_TEST_NOTIFICATION) {
      this.logger.log(
        `Test notification job completed: ${job.id} (not saved to DB)`,
      );
      return;
    }

    // Only save regular notifications
    if (job.name === NOTIFICATION_JOBS.SEND_NOTIFICATION) {
      this.logger.log({
        message: 'Job completed',
        jobId: job.id,
        context: 'NotificationProcessor',
      });
      const { title, body, userId, type } = job.data as SendNotificationJob;
      await this.notificationsService.saveNotificationRecord(
        title,
        body,
        userId,
        type,
      );
      this.logger.log({
        message: 'Notification saved to DB',
        jobId: job.id,
        context: 'NotificationProcessor',
      });
    }
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job<SendNotificationJob | TestNotificationJob>) {
    // Skip logging for test notification failures (if needed)
    if (job.name === NOTIFICATION_JOBS.SEND_TEST_NOTIFICATION) {
      this.logger.error(
        `Test notification job failed: ${job.id} - ${job.failedReason}`,
      );
      return;
    }

    // Log regular notification failures
    this.logger.error({
      message: 'Job failed',
      jobId: job.id,
      reason: job.failedReason,
      context: 'NotificationProcessor',
    });
  }
}
