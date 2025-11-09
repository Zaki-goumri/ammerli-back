import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Invoice, InvoiceStatus } from '../entities/invoice.entity';
import { OrderService } from 'src/core/order/services/order.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { QUEUE_NAME } from 'src/common/constants/queues';
import { UPLOAD_JOBS } from 'src/common/constants/jobs';
import { OnEvent } from '@nestjs/event-emitter';
import { ObjectService } from 'src/infrastructure/object-storage/object-storage.service';
import { Readable } from 'typeorm/platform/PlatformTools';
import { InvoiceGeneratorService } from './invoice-generator.service';

@Injectable()
export class InvoiceService {
  private readonly logger = new Logger(InvoiceService.name);

  constructor(
    @InjectRepository(Invoice)
    private readonly invoiceRepository: Repository<Invoice>,
    private readonly invoiceGeneratorService: InvoiceGeneratorService,
    private readonly orderService: OrderService,
    @InjectQueue(QUEUE_NAME.UPLOAD)
    private readonly uploadQueue: Queue,
    private readonly objectStorageService: ObjectService,
  ) {}

  async generateInvoiceForOrder(orderId: number): Promise<Invoice> {
    let invoice = await this.invoiceRepository.findOne({ where: { orderId } });
    if (invoice) {
      return invoice;
    }

    const order = await this.orderService.findOneForInvoice(orderId);
    const invoiceData = this.invoiceGeneratorService.prepareInvoiceData(
      order as any,
    );

    const pdfBuffer =
      await this.invoiceGeneratorService.generateInvoicePDF(invoiceData);

    invoice = this.invoiceRepository.create({
      orderId,
      invoiceNumber: invoiceData.invoiceNumber,
      pdfUrl: '',
      fileSize: pdfBuffer.length,
      status: InvoiceStatus.GENERATED,
    });
    await this.invoiceRepository.save(invoice);

    const file: Express.Multer.File = {
      fieldname: 'file',
      originalname: `invoice-${invoiceData.invoiceNumber}.pdf`,
      encoding: '7bit',
      mimetype: 'application/pdf',
      buffer: pdfBuffer,
      size: pdfBuffer.length,
      stream: Readable.from(pdfBuffer),
      destination: '',
      filename: '',
      path: '',
    };

    this.logger.debug(
      `Generated PDF for invoice ${invoiceData.invoiceNumber}, size: ${pdfBuffer.length} bytes`,
    );
    await this.uploadQueue.add(UPLOAD_JOBS.UPLOAD_FILE, {
      file,
      metadata: { targetId: invoice.id.toString(), targetType: 'invoice' },
    });

    return invoice;
  }

  @OnEvent('file.uploaded.invoice')
  async handleInvoiceUploaded({
    targetId,
    fileUrl,
  }: {
    targetId: number;
    fileUrl: string;
  }) {
    this.logger.log(
      `Invoice PDF uploaded for invoice ${targetId}, URL: ${fileUrl}`,
    );
    await this.invoiceRepository.update(targetId, { pdfUrl: fileUrl });
  }

  async getManyInvoicesForUser(userId: number): Promise<Partial<Invoice>[]> {
    return this.invoiceRepository.find({
      where: { order: { buyerId: userId } },
      select: ['id', 'orderId', 'invoiceNumber', 'createdAt', 'pdfUrl'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Invoice> {
    const invoice = await this.invoiceRepository.findOne({ where: { id } });
    if (!invoice) {
      throw new NotFoundException(`Invoice with ID ${id} not found.`);
    }
    return invoice;
  }

  async findByOrderId(orderId: number): Promise<Invoice> {
    const invoice = await this.invoiceRepository.findOne({
      where: { orderId },
    });
    if (!invoice) {
      throw new NotFoundException(`Invoice for order ID ${orderId} not found.`);
    }
    return invoice;
  }

  async findAll(): Promise<Invoice[]> {
    return this.invoiceRepository.find({ order: { createdAt: 'DESC' } });
  }

  async getInvoicePDF(id: number): Promise<Buffer> {
    const invoice = await this.findOne(id);
    if (!invoice.pdfUrl) {
      throw new NotFoundException('PDF not available for this invoice.');
    }
    const objectName = this.objectStorageService.getFileNameFromUrl(
      invoice.pdfUrl,
    );
    return this.objectStorageService.getFile(objectName);
  }

  async regenerateInvoice(id: number): Promise<Invoice> {
    const invoice = await this.findOne(id);
    const order = await this.orderService.findOneForInvoice(invoice.orderId);
    const invoiceData = this.invoiceGeneratorService.prepareInvoiceData(
      order as any,
    );
    const pdfBuffer =
      await this.invoiceGeneratorService.generateInvoicePDF(invoiceData);

    invoice.fileSize = pdfBuffer.length;
    await this.invoiceRepository.save(invoice);

    const file: Express.Multer.File = {
      fieldname: 'file',
      originalname: `invoice-${invoiceData.invoiceNumber}.pdf`,
      encoding: '7bit',
      mimetype: 'application/pdf',
      buffer: pdfBuffer,
      size: pdfBuffer.length,
      stream: Readable.from(pdfBuffer),
      destination: '',
      filename: '',
      path: '',
    };

    await this.uploadQueue.add(UPLOAD_JOBS.UPLOAD_FILE, {
      file,
      metadata: { targetId: invoice.id.toString(), targetType: 'invoice' },
    });

    return invoice;
  }

  async updateStatus(id: number, status: InvoiceStatus): Promise<Invoice> {
    const invoice = await this.findOne(id);
    invoice.status = status;
    return this.invoiceRepository.save(invoice);
  }

  async delete(id: number): Promise<void> {
    const result = await this.invoiceRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Invoice with ID ${id} not found.`);
    }
  }
}
