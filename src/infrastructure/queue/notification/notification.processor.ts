import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { QUEUE_NAME } from 'src/common/constants/queues';
import { Logger } from '@nestjs/common';
import { NOTIFICATION_JOBS } from 'src/common/constants/jobs';
import { NotificationsService } from 'src/core/notifications/notifications.service';
import { FirebaseService } from 'src/infrastructure/firebase/firebase.service';
import { NotificationType } from 'src/core/notifications/enums/notification-type.enum';
import { from, retry, catchError, throwError, Observable } from 'rxjs';
import { delay, lastValueFrom } from 'rxjs';
import { Language } from 'src/core/notifications/entities/token.entity';

interface SendNotificationJob {
  titleKey: string;
  bodyKey: string;
  userId: number;
  type: NotificationType;
  translationArgs?: Record<string, any>;
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
        const response = await lastValueFrom(
          this.sendNotificationToOneDevice(message),
        );
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

  sendNotificationToOneDevice(
    message: NotificationMessage,
  ): Observable<string> {
    this.logger.log({
      message: 'Sending notification to token',
      tokenPrefix: message.token.substring(0, 20),
      context: 'NotificationProcessor',
    });

    return from(this.firebaseService.getFcm().send(message)).pipe(
      retry({
        count: 3,
        delay: (error, retryCount) => {
          if (this.isInvalidTokenError(error)) {
            this.logger.warn({
              message: 'Invalid token detected, skipping retry',
              tokenPrefix: message.token.substring(0, 20),
              context: 'NotificationProcessor',
            });
            return throwError(() => error);
          }

          this.logger.warn({
            message: 'Retrying notification send (transient error)',
            tokenPrefix: message.token.substring(0, 20),
            attempt: retryCount,
            error: error.message,
            context: 'NotificationProcessor',
          });

          const delayMs = Math.pow(2, retryCount - 1) * 1000;
          return throwError(() => error).pipe(delay(delayMs));
        },
      }),
      catchError((error) => {
        this.logger.error({
          message: 'Failed to send notification',
          tokenPrefix: message.token.substring(0, 20),
          error: error.message,
          context: 'NotificationProcessor',
        });
        return throwError(() => error);
      }),
    );
  }

  async handleSendingNotification(data: SendNotificationJob): Promise<void> {
    this.logger.log({
      message: 'Handling sending notification',
      userId: data.userId,
      title: data.titleKey,
      type: data.type,
      context: 'NotificationProcessor',
    });

    const tokensWithLangs =
      await this.notificationsService.getActiveTokensForUser(data.userId);

    if (tokensWithLangs.length === 0) {
      this.logger.warn(`No active tokens found for user ${data.userId}`);
      return;
    }

    const messages: NotificationMessage[] = tokensWithLangs.map(
      (tokenWithLang) => {
        const transalatedNotification =
          this.notificationsService.translateNotification(
            tokenWithLang.lang as Language,
            data.bodyKey,
            data.titleKey,
            data.translationArgs,
          );
        const messages = {
          notification: {
            title: transalatedNotification.title as string,
            body: transalatedNotification.body as string,
          },
          token: tokenWithLang.token,
          data: {
            type: data.type,
          },
        };
        return messages;
      },
    );
    // Convert observables to promises and handle results
    const results = await Promise.allSettled(
      messages.map((message) =>
        lastValueFrom(this.sendNotificationToOneDevice(message)),
      ),
    );

    console.log(results);
    // Auto-cleanup invalid FCM tokens
    const invalidTokens: string[] = [];
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        const error = result.reason;
        // Check if the error is related to invalid token
        if (this.isInvalidTokenError(error)) {
          invalidTokens.push(tokensWithLangs[index].token);
          this.logger.warn(
            `Invalid FCM token detected after retries: ${tokensWithLangs[index].token.substring(0, 20)}...`,
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
        `Auto-removed ${invalidTokens.length} invalid FCM token(s) after retry attempts`,
      );
    }

    this.logger.log({
      message: 'Sending notification handled',
      totalTokens: tokensWithLangs.length,
      successfulTokens: results.filter((r) => r.status === 'fulfilled').length,
      invalidTokens: invalidTokens.length,
      context: 'NotificationProcessor',
    });
  }

  private isInvalidTokenError(error: any): boolean {
    if (!error) return false;

    const errorCode = error.code || error.errorInfo?.code;
    const invalidTokenCodes = [
      'messaging/invalid-registration-token',
      'messaging/registration-token-not-registered',
      'messaging/invalid-argument',
    ];

    return invalidTokenCodes.includes(errorCode);
  }

  private isTransientError(error: any): boolean {
    if (!error) return false;

    const errorCode = error.code || error.errorInfo?.code;
    const transientErrorCodes = [
      'messaging/server-unavailable',
      'messaging/internal-error',
      'messaging/unavailable',
    ];

    return (
      transientErrorCodes.includes(errorCode) ||
      error.message?.includes('ECONNRESET') ||
      error.message?.includes('ETIMEDOUT')
    );
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
      const { titleKey, bodyKey, userId, type, translationArgs } =
        job.data as SendNotificationJob;
      await this.notificationsService.saveNotificationRecord(
        titleKey,
        bodyKey,
        userId,
        type,
        translationArgs as Record<string, any>,
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
    if (job.name === NOTIFICATION_JOBS.SEND_TEST_NOTIFICATION) {
      this.logger.error(
        `Test notification job failed: ${job.id} - ${job.failedReason}`,
      );
      return;
    }

    this.logger.error({
      message: 'Job failed',
      jobId: job.id,
      reason: job.failedReason,
      context: 'NotificationProcessor',
    });
  }
}
