import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { INVOICE_JOBS } from 'src/common/constants/jobs';
import { QUEUE_NAME } from 'src/common/constants/queues';
import { Logger } from '@nestjs/common';
import { GenerateInvoiceDto } from './dto/generate-invoice.dto';
import { InvoiceGeneratorService } from 'src/core/invoice/services/invoice-generator.service';
import { NotificationsService } from 'src/core/notifications/notifications.service';
import { NOTIFICATION_TYPE } from 'src/core/notifications/enums/notification-type.enum';

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
        this.logger.log({
          message: 'Generating invoice',
          orderId: job.data.orderId,
          context: 'InvoiceProcessor',
        });
        return this.invoiceGeneratorService.generateInvoice(job.data.orderId);
      default:
        return Promise.resolve({
          message: 'Unknown job processed',
          jobId: job.id,
        });
    }
  }

  @OnWorkerEvent('completed')
  async onCompleted(job: Job<GenerateInvoiceDto>) {
    this.logger.log({
      message: 'Invoice generation job completed',
      jobId: job.id,
      context: 'InvoiceProcessor',
    });

    const { orderId, buyerId, ...invoiceData } = job.returnvalue;
    this.logger.log({
      message: 'Saving invoice record',
      context: 'InvoiceProcessor',
    });
    await this.invoiceGeneratorService.saveInvoiceRecord({
      orderId,
      ...invoiceData,
    });

    await this.notificationsService.sendNotification(
      'notifications.invoice.generated.title',
      'notifications.invoice.generated.body',
      buyerId,
      NOTIFICATION_TYPE.ORDERS,
      { orderId },
    );

    this.logger.log({
      message: 'Notification sent for invoice generation',
      orderId,
      context: 'InvoiceProcessor',
    });
  }

  @OnWorkerEvent('failed')
  async onFailed(job: Job<GenerateInvoiceDto>, error: Error) {
    this.logger.error({
      message: 'Invoice generation job failed',
      jobId: job.id,
      error: error.message,
      context: 'InvoiceProcessor',
    });
    const { orderId } = job.data;

    const buyerId =
      await this.invoiceGeneratorService.getBuyerIdFromOrderId(orderId);

    await this.notificationsService.sendNotification(
      'notifications.invoice.generation_failed.title',
      'notifications.invoice.generation_failed.body',
      buyerId,
      NOTIFICATION_TYPE.ORDERS,
      { orderId },
    );
    this.logger.log({
      message: 'Failure notification sent for invoice generation',
      orderId,
      context: 'InvoiceProcessor',
    });
  }
}
