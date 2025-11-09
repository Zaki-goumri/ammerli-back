import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { INVOICE_JOBS } from 'src/common/constants/jobs';
import { QUEUE_NAME } from 'src/common/constants/queues';
import { Logger } from '@nestjs/common';
import { GenerateInvoiceDto } from './dto/generate-invoice.dto';
import { InvoiceGeneratorService } from 'src/core/invoice/services/invoice-generator.service';
import { NotificationsService } from 'src/core/notifications/notifications.service';
import {
  NOTIFICATION_TYPE,
  NotificationType,
} from 'src/core/notifications/enums/notification-type.enum';

@Processor(QUEUE_NAME.INVOICE)
export class InvoiceProcessor extends WorkerHost {
  private readonly logger = new Logger(InvoiceProcessor.name);

  constructor(
    private readonly invoiceGeneratorService: InvoiceGeneratorService,
    private readonly notificationsService: NotificationsService,
  ) {
    super();
  }

  async process(job: Job<GenerateInvoiceDto, any, string>): Promise<any> {
    this.logger.log(`Processing job ${job.id} of type ${job.name}`);
    switch (job.name) {
      case INVOICE_JOBS.GENERATE_INVOICE:
        this.logger.log(`Generating invoice for order ID: ${job.data.orderId}`);
        const invoicePath = await this.invoiceGeneratorService.generateInvoice(
          job.data.orderId as number,
        );
        return {
          message: 'Invoice generated successfully',
          invoicePath,
          orderId: job.data.orderId,
        };
      default:
        return Promise.resolve({
          message: 'Unknown job processed',
          jobId: job.id,
        });
    }
  }

  @OnWorkerEvent('completed')
  async onCompleted(job: Job<GenerateInvoiceDto>) {
    this.logger.log(`Invoice generation job completed: ${job.id}`);
    const { orderId } = job.data;

    const buyerId =
      await this.invoiceGeneratorService.getBuyerIdFromOrderId(orderId);

    await this.notificationsService.sendNotification(
      'Invoice Generated',
      `Your invoice for order ${orderId} has been generated and is available.`,
      buyerId,
      NOTIFICATION_TYPE.ORDERS,
    );

    this.logger.log(
      `Notification sent for invoice generation for order ${orderId}`,
    );
  }

  @OnWorkerEvent('failed')
  async onFailed(job: Job<GenerateInvoiceDto>, error: Error) {
    this.logger.error(
      `Invoice generation job failed: ${job.id}, Error: ${error.message}`,
    );
    const { orderId } = job.data;

    const buyerId =
      await this.invoiceGeneratorService.getBuyerIdFromOrderId(orderId);

    await this.notificationsService.sendNotification(
      'Invoice Generation Failed',
      `Failed to generate invoice for order ${orderId}. Please contact support.`,
      buyerId,
      NOTIFICATION_TYPE.ORDERS,
    );
    this.logger.log(
      `Failure notification sent for invoice generation for order ${orderId}`,
    );
  }
}
