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
import { OrderForInvoice } from '../interfaces/invoice.interface';
import { RedisService } from 'nestjs-redis-client';
import { ConfigService } from '@nestjs/config';
import { BUCKET_TARGETS } from 'src/common/constants/buckets';
import { I18nService } from 'nestjs-i18n';
import {
  PaginationQueryDto,
  PaginationResponseDto,
} from 'src/common/dtos/pagination.dto';
import { SendInvoiceDto } from 'src/core/invoice/dto/send-invoice.dto';

@Injectable()
export class InvoiceService {
  private readonly logger = new Logger(InvoiceService.name);
  private readonly CACHE_TTL: number;

  constructor(
    @InjectRepository(Invoice)
    private readonly invoiceRepository: Repository<Invoice>,
    private readonly invoiceGeneratorService: InvoiceGeneratorService,
    private readonly orderService: OrderService,
    @InjectQueue(QUEUE_NAME.UPLOAD)
    private readonly uploadQueue: Queue,
    private readonly objectStorageService: ObjectService,
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
    private readonly i18nService: I18nService,
  ) {
    this.CACHE_TTL = this.configService.get<number>('CACHE_TTL') ?? 5 * 60;
  }

  static getCacheKey(id: number | string, prefix: string): string {
    return `invoice:${prefix}:${id}`;
  }

  /**
   * Generates an invoice for a given order if it doesn't already exist.
   * @param orderId - The ID of the order to generate an invoice for.
   * @returns A promise that resolves to the generated or existing invoice.
   */
  async generateInvoiceForOrder(orderId: number): Promise<Invoice> {
    const existingInvoice = await this.invoiceRepository.findOne({
      where: { orderId },
    });
    if (existingInvoice) {
      return existingInvoice;
    }

    const order = (await this.orderService.findOneForInvoice(
      orderId,
    )) as OrderForInvoice;
    return this._generateAndUploadInvoice(order);
  }

  /**
   * Handles the 'file.uploaded.invoice' event to update the invoice with the PDF URL.
   * @param targetId - The ID of the invoice.
   * @param objectName - The name of the uploaded PDF file in object storage.
   */
  @OnEvent(`file.uploaded.${BUCKET_TARGETS.INVOICES}`)
  async handleInvoiceUploaded({
    targetId,
    objectName,
  }: {
    targetId: number;
    objectName: string;
  }) {
    this.logger.log({
      message: 'Invoice PDF uploaded',
      invoiceId: targetId,
      objectName,
      context: 'Invoice',
    });
    await this.invoiceRepository.update(targetId, { pdfUrl: objectName });
  }

  /**
   * Retrieves all invoices for a specific user with presigned URLs for the PDFs.
   * @param userId - The ID of the user.
   * @returns A promise that resolves to a list of partial invoice data.
   */
  async getManyInvoicesForUser(
    userId: number,
    paginationQuery: PaginationQueryDto,
  ): Promise<PaginationResponseDto<SendInvoiceDto>> {
    const { page, limit } = paginationQuery;
    const [data, total] = await this.invoiceRepository.findAndCount({
      order: { createdAt: 'DESC' },
      take: limit,
      skip: (page - 1) * limit,
      select: ['id', 'createdAt', 'pdfUrl'],
      where: { order: { buyerId: userId } },
    });
    return {
      meta: {
        total: total,
        page,
        limit,
        hasNextPage: page * limit < total,
        totalPages: Math.ceil(total / limit),
      },
      data,
    };
  }

  /**
   * Finds a single invoice by its ID, with a presigned URL for the PDF.
   * @param id - The ID of the invoice.
   * @returns A promise that resolves to the invoice.
   * @throws {NotFoundException} If the invoice is not found.
   */
  async findOne(id: number): Promise<Invoice> {
    const cacheKey = InvoiceService.getCacheKey(id, 'id');
    const cachedInvoice = await this.redisService.get<Invoice>(cacheKey);
    if (cachedInvoice) {
      return cachedInvoice;
    }

    const invoice = await this.invoiceRepository.findOne({ where: { id } });
    if (!invoice) {
      throw new NotFoundException(
        this.i18nService.t('invoice.notFound', { args: { id } }),
      );
    }
    if (invoice.pdfUrl) {
      invoice.pdfUrl = await this.objectStorageService.getPresignedUrl(
        invoice.pdfUrl,
        BUCKET_TARGETS.INVOICES,
      );
    }

    await this.redisService.set(cacheKey, invoice, this.CACHE_TTL);
    return invoice;
  }

  /**
   * Finds an invoice by its order ID, with a presigned URL for the PDF.
   * @param orderId - The ID of the order.
   * @returns A promise that resolves to the invoice.
   * @throws {NotFoundException} If the invoice is not found.
   */
  async findByOrderId(orderId: number): Promise<Invoice> {
    const cacheKey = InvoiceService.getCacheKey(orderId, 'orderId');
    const cachedInvoice = await this.redisService.get<Invoice>(cacheKey);
    if (cachedInvoice) {
      return cachedInvoice;
    }

    const invoice = await this.invoiceRepository.findOne({
      where: { orderId },
    });
    if (!invoice) {
      throw new NotFoundException(
        this.i18nService.t('invoice.notFoundForOrder', {
          args: { id: orderId },
        }),
      );
    }

    await this.redisService.set(cacheKey, invoice, this.CACHE_TTL);
    return invoice;
  }

  /**
   * Retrieves all invoices, with presigned URLs for the PDFs.
   * @returns A promise that resolves to a list of all invoices.
   */
  async findAll(
    paginationQuery: PaginationQueryDto,
  ): Promise<PaginationResponseDto<SendInvoiceDto>> {
    const { page, limit } = paginationQuery;
    const [data, total] = await this.invoiceRepository.findAndCount({
      order: { createdAt: 'DESC' },
      take: limit,
      skip: (page - 1) * limit,
      select: ['id', 'createdAt', 'pdfUrl'],
    });
    return {
      meta: {
        total: total,
        page,
        limit,
        hasNextPage: page * limit < total,
        totalPages: Math.ceil(total / limit),
      },
      data,
    };
  }

  /**
   * Retrieves the PDF buffer for a given invoice ID.
   * @param id - The ID of the invoice.
   * @returns A promise that resolves to the PDF buffer.
   * @throws {NotFoundException} If the invoice or its PDF is not found.
   */
  async getInvoicePDF(id: number): Promise<Buffer> {
    const cacheKey = InvoiceService.getCacheKey(id, 'pdf');
    const cachedPdf = await this.redisService.get<string>(cacheKey);
    if (cachedPdf) {
      return Buffer.from(cachedPdf, 'base64');
    }

    const invoice = await this.findOne(id);
    if (!invoice.pdfUrl) {
      throw new NotFoundException(
        this.i18nService.t('invoice.pdfNotAvailable'),
      );
    }
    const objectName = this.objectStorageService.getFileNameFromUrl(
      invoice.pdfUrl,
    );
    const pdfBuffer = await this.objectStorageService.getFile(
      objectName,
      BUCKET_TARGETS.INVOICES,
    );

    await this.redisService.set(
      cacheKey,
      pdfBuffer.toString('base64'),
      this.CACHE_TTL,
    );
    return pdfBuffer;
  }

  /**
   * Regenerates the PDF for an existing invoice.
   * @param id - The ID of the invoice to regenerate.
   * @returns A promise that resolves to the regenerated invoice.
   */
  async regenerateInvoice(id: number): Promise<Invoice> {
    const invoice = await this.findOne(id);
    const order = (await this.orderService.findOneForInvoice(
      invoice.orderId,
    )) as OrderForInvoice;
    return this._generateAndUploadInvoice(order, invoice);
  }

  /**
   * Generates an invoice PDF, uploads it to object storage, and saves/updates the invoice entity.
   * @param order - The order data for which to generate the invoice.
   * @param existingInvoice - Optional. An existing invoice entity to update. If not provided, a new one will be created.
   * @returns A promise that resolves to the created or updated invoice.
   */
  private async _generateAndUploadInvoice(
    order: OrderForInvoice,
    existingInvoice?: Invoice,
  ): Promise<Invoice> {
    const invoiceData = this.invoiceGeneratorService.prepareInvoiceData(order);
    const pdfBuffer =
      await this.invoiceGeneratorService.generateInvoicePDF(invoiceData);

    let invoice: Invoice;
    if (existingInvoice) {
      invoice = existingInvoice;
      invoice.fileSize = pdfBuffer.length;
    } else {
      invoice = this.invoiceRepository.create({
        orderId: order.id,
        invoiceNumber: invoiceData.invoiceNumber,
        pdfUrl: '',
        fileSize: pdfBuffer.length,
        status: InvoiceStatus.GENERATED,
      });
    }
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

    this.logger.log({
      message: 'Invoice generated and queued for upload',
      invoiceId: invoice.id,
      invoiceNumber: invoiceData.invoiceNumber,
      fileSize: pdfBuffer.length,
      context: 'Invoice',
    });
    await this.uploadQueue.add(UPLOAD_JOBS.UPLOAD_FILE, {
      file,
      metadata: {
        targetId: invoice.id.toString(),
        targetType: BUCKET_TARGETS.INVOICES,
      },
    });

    await this.invalidateInvoiceCache(invoice);
    return invoice;
  }

  /**
   * Updates the status of an invoice.
   * @param id - The ID of the invoice to update.
   * @param status - The new status of the invoice.
   * @returns A promise that resolves to the updated invoice.
   */
  async updateStatus(id: number, status: InvoiceStatus): Promise<Invoice> {
    const invoice = await this.findOne(id);
    invoice.status = status;
    const updatedInvoice = await this.invoiceRepository.save(invoice);
    await this.invalidateInvoiceCache(invoice);
    return updatedInvoice;
  }

  /**
   * Deletes an invoice by its ID.
   * @param id - The ID of the invoice to delete.
   * @throws {NotFoundException} If the invoice is not found.
   */
  async delete(id: number): Promise<void> {
    const invoice = await this.findOne(id);
    if (!invoice) {
      throw new NotFoundException(
        this.i18nService.t('invoice.notFound', { args: { id } }),
      );
    }
    await this.invalidateInvoiceCache(invoice);

    this.logger.log({
      message: 'Invoice deleted',
      invoiceId: id,
      context: 'Invoice',
    });

    const result = await this.invoiceRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(
        this.i18nService.t('invoice.notFound', { args: { id } }),
      );
    }
  }

  /**
   * Invalidates the cache entries for a given invoice.
   * This includes the invoice object by ID, by order ID, and the PDF buffer.
   * @param invoice - The invoice object whose cache entries should be invalidated.
   */
  private async invalidateInvoiceCache(invoice: Invoice): Promise<void> {
    const cacheKeyId = InvoiceService.getCacheKey(invoice.id, 'id');
    const cacheKeyOrderId = InvoiceService.getCacheKey(
      invoice.orderId,
      'orderId',
    );
    const cacheKeyPdf = InvoiceService.getCacheKey(invoice.id, 'pdf');

    await this.redisService.del(cacheKeyId);
    await this.redisService.del(cacheKeyOrderId);
    await this.redisService.del(cacheKeyPdf);
  }
}
