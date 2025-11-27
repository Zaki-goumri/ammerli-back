import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';
import PDFDocument from 'pdfkit';
import { InvoiceData, OrderForInvoice } from '../interfaces/invoice.interface';
import { InjectRepository } from '@nestjs/typeorm';
import { Order } from 'src/core/order/entities/order.entity';
import { Repository } from 'typeorm';
import { ObjectService } from 'src/infrastructure/object-storage/object-storage.service';
import { PaymentMethodType } from 'src/core/order/enums/payment-method.enum';
import { BUCKET_TARGETS } from 'src/common/constants/buckets';
import { Invoice } from '../entities/invoice.entity';
import { I18nService } from 'nestjs-i18n';
import { Readable } from 'stream';

const DELIVERY_ESTIMATION_DAYS = 2;

interface GenerateInvoiceResult {
  objectName: string;
  invoiceNumber: string;
  fileSize: number;
  buyerId: number;
  orderId: number;
}

@Injectable()
export class InvoiceGeneratorService {
  private readonly logger = new Logger(InvoiceGeneratorService.name);

  constructor(
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    @InjectRepository(Invoice)
    private readonly invoiceRepo: Repository<Invoice>,
    private readonly objectService: ObjectService,
    private readonly i18nService: I18nService,
  ) {}

  async generateInvoice(orderId: number): Promise<GenerateInvoiceResult> {
    const order = await this.findOneForInvoice(orderId);
    const invoiceData = this.prepareInvoiceData(order);
    const pdfBuffer = await this.generateInvoicePDF(invoiceData);

    const invoiceFileName = `invoice-${orderId}-${Date.now()}.pdf`;
    const file: Express.Multer.File = {
      fieldname: 'file',
      originalname: invoiceFileName,
      encoding: '7bit',
      mimetype: 'application/pdf',
      buffer: pdfBuffer,
      size: pdfBuffer.length,
      stream: Readable.from(pdfBuffer),
      destination: '',
      filename: '',
      path: '',
    };

    const uploadResult = await this.objectService.uploadFile(file, {
      bucketName: BUCKET_TARGETS.INVOICES as string,
    });

    return {
      objectName: uploadResult.objectName,
      invoiceNumber: invoiceData.invoiceNumber,
      fileSize: pdfBuffer.length,
      buyerId: order.buyer.id,
      orderId: order.id,
    };
  }

  async generateInvoicePDF(data: InvoiceData): Promise<Buffer> {
    const logoBuffer = await this.getLogo();

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 28.35, bottom: 28.35, left: 28.35, right: 28.35 }, // 1cm margin
        bufferPages: true,
      });

      const buffers: Buffer[] = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        resolve(Buffer.concat(buffers));
      });
      doc.on('error', reject);

      this.generateHeader(doc, logoBuffer);
      this.generateTitle(doc);
      this.generateInvoiceInfo(doc, data);
      this.generateClientInfo(doc, data);
      this.generateProductsTable(doc, data);
      this.generateSummary(doc, data);
      this.generateDeliveryInfo(doc);
      this.generateBankInfo(doc);
      this.generateFooter(doc);

      doc.end();
    });
  }

  private generateHeader(doc: PDFKit.PDFDocument, logo: Buffer | null) {
    if (logo) {
      doc.image(logo, 30, 30, { width: 150 });
    }

    // Company info on the right
    doc
      .font('Helvetica-Bold')
      .fontSize(10)
      .text('Amerli', 400, 50, { align: 'right' })
      .font('Helvetica')
      .fontSize(9)
      .text('12 Rue des Frères Boukhalfa', 400, 65, { align: 'right' })
      .text('Hydra, Alger, Algérie', 400, 78, { align: 'right' })
      .text('Tél : +213 550 123 456', 400, 91, { align: 'right' })
      .text('Email : contact@amerli.dz', 400, 104, { align: 'right' })
      .text('NIF : 001625478953214', 400, 117, { align: 'right' })
      .text('RC : 16B1234567', 400, 130, { align: 'right' });
  }

  private generateTitle(doc: PDFKit.PDFDocument) {
    doc
      .font('Helvetica-Bold')
      .fontSize(20)
      .text('FACTURE', 0, 160, { align: 'center' });
    const pageWidth = doc.page.width;
    const lineWidth = 200;
    const lineX = (pageWidth - lineWidth) / 2;
    doc
      .moveTo(lineX, 185)
      .lineTo(lineX + lineWidth, 185)
      .lineWidth(2)
      .stroke();
  }

  private generateInvoiceInfo(doc: PDFKit.PDFDocument, data: InvoiceData) {
    const y = 195;

    doc
      .font('Helvetica-Bold')
      .fontSize(10)
      .text('Numéro de facture :', 40, y)
      .font('Helvetica')
      .text(data.invoiceNumber, 155, y);

    doc
      .font('Helvetica-Bold')
      .text('Date :', 420, y)
      .font('Helvetica')
      .text(data.invoiceDate, 455, y);

    doc
      .font('Helvetica-Bold')
      .text('Date de livraison prévue :', 40, y + 18)
      .font('Helvetica')
      .text(data.deliveryDate, 190, y + 18);
  }

  private generateClientInfo(doc: PDFKit.PDFDocument, data: InvoiceData) {
    const startY = 235;

    doc
      .font('Helvetica-Bold')
      .fontSize(10)
      .text('Client :', 40, startY)
      .font('Helvetica')
      .text(data.clientName, 150, startY);

    doc
      .font('Helvetica-Bold')
      .text('Adresse :', 40, startY + 18)
      .font('Helvetica')
      .text(data.clientAddress, 150, startY + 18, { width: 400 });

    doc
      .font('Helvetica-Bold')
      .text('Téléphone :', 40, startY + 36)
      .font('Helvetica')
      .text(data.clientPhone, 150, startY + 36);

    doc
      .font('Helvetica-Bold')
      .text('Mode de paiement :', 40, startY + 54)
      .font('Helvetica')
      .text(data.paymentMethod, 150, startY + 54);
  }

  private generateProductsTable(doc: PDFKit.PDFDocument, data: InvoiceData) {
    const tableTop = 330;
    const rowHeight = 25;
    const col1X = 40;
    const col2X = 225;
    const col3X = 330;
    const col4X = 385;
    const col5X = 465;
    const tableWidth = 515;

    // Table header with gray background
    doc
      .rect(col1X, tableTop, tableWidth, rowHeight)
      .fillAndStroke('#f5f5f5', '#000000')
      .fillColor('#000000');

    // Draw vertical lines for header
    doc
      .moveTo(col2X, tableTop)
      .lineTo(col2X, tableTop + rowHeight)
      .moveTo(col3X, tableTop)
      .lineTo(col3X, tableTop + rowHeight)
      .moveTo(col4X, tableTop)
      .lineTo(col4X, tableTop + rowHeight)
      .moveTo(col5X, tableTop)
      .lineTo(col5X, tableTop + rowHeight)
      .stroke();

    doc
      .font('Helvetica-Bold')
      .fontSize(10)
      .text('Désignation du produit', col1X + 5, tableTop + 8, {
        width: col2X - col1X - 10,
      })
      .text('Marque', col2X + 5, tableTop + 8, { width: col3X - col2X - 10 })
      .text('Qté', col3X, tableTop + 8, {
        width: col4X - col3X,
        align: 'center',
      })
      .text('P.U. (DZD)', col4X, tableTop + 8, {
        width: col5X - col4X,
        align: 'center',
      })
      .text('Total (DZD)', col5X, tableTop + 8, {
        width: col1X + tableWidth - col5X,
        align: 'center',
      });

    doc.font('Helvetica').fontSize(10);
    let y = tableTop + rowHeight;

    for (const product of data.products) {
      doc.rect(col1X, y, tableWidth, rowHeight).stroke();

      doc
        .moveTo(col2X, y)
        .lineTo(col2X, y + rowHeight)
        .moveTo(col3X, y)
        .lineTo(col3X, y + rowHeight)
        .moveTo(col4X, y)
        .lineTo(col4X, y + rowHeight)
        .moveTo(col5X, y)
        .lineTo(col5X, y + rowHeight);

      doc
        .text(product.name, col1X + 5, y + 8, { width: col2X - col1X - 10 })
        .text(product.brand, col2X + 5, y + 8, { width: col3X - col2X - 10 })
        .text(product.quantity.toString(), col3X, y + 8, {
          width: col4X - col3X,
          align: 'center',
        })
        .text(product.unitPrice, col4X, y + 8, {
          width: col5X - col4X,
          align: 'center',
        })
        .text(product.total, col5X, y + 8, {
          width: col1X + tableWidth - col5X,
          align: 'center',
        });

      y += rowHeight;
    }
  }

  private generateSummary(doc: PDFKit.PDFDocument, data: InvoiceData) {
    const summaryTop = doc.y + 25;

    doc
      .font('Helvetica-Bold')
      .fontSize(11)
      .text('Sous-total :', 370, summaryTop)
      .font('Helvetica')
      .text(`${data.subtotal} DZD`, 470, summaryTop, { align: 'right' });

    doc
      .font('Helvetica-Bold')
      .fontSize(12)
      .text('Montant total :', 370, summaryTop + 22)
      .text(`${data.totalAmount} DZD`, 470, summaryTop + 22, {
        align: 'right',
      });
  }

  private generateDeliveryInfo(doc: PDFKit.PDFDocument) {
    const y = doc.y + 25;

    doc
      .font('Helvetica-Bold')
      .fontSize(10)
      .text('Livraison : ', 40, y, { continued: true })
      .font('Helvetica')
      .text("sous 48h ouvrables à l'adresse du client.");

    doc
      .text('Transport assuré par ', 40, y + 15, { continued: true })
      .font('Helvetica-Bold')
      .text('Amerli')
      .font('Helvetica')
      .text('.');
  }

  private generateBankInfo(doc: PDFKit.PDFDocument) {
    const y = doc.y + 20;

    doc
      .font('Helvetica-Bold')
      .fontSize(10)
      .text('Coordonnées bancaires :', 40, y)
      .font('Helvetica')
      .text("Banque Extérieure d'Algérie (BEA)", 40, y + 15)
      .text('IBAN : DZ58 001 000 123456789000000', 40, y + 30)
      .text('Code SWIFT : BEXADZAL', 40, y + 45);
  }

  private generateFooter(doc: PDFKit.PDFDocument) {
    const pageHeight = doc.page.height;
    const footerY = pageHeight - 50;

    // Horizontal line
    doc.moveTo(150, footerY).lineTo(450, footerY).lineWidth(1).stroke();

    // Footer text
    doc
      .font('Helvetica-Oblique')
      .fontSize(9)
      .fillColor('#666666')
      .text(
        'Amerli – Vente de produits alimentaires en gros.',
        0,
        footerY + 10,
        { align: 'center' },
      );
  }

  private async getLogo(): Promise<Buffer | null> {
    try {
      const logoPath = path.join(
        process.cwd(),
        'src/core/invoice/templates/assets/logo.png',
      );
      return await fs.readFile(logoPath);
    } catch (err) {
      this.logger.warn('Logo file not found or failed to load');
      return null;
    }
  }

  async saveInvoiceRecord(data: {
    orderId: number;
    invoiceNumber: string;
    objectName: string;
    fileSize: number;
  }): Promise<Invoice> {
    this.logger.log(`Saving invoice record for order ID: ${data.orderId}`);
    const { orderId, invoiceNumber, objectName, fileSize } = data;
    const newInvoice = this.invoiceRepo.create({
      orderId,
      invoiceNumber,
      pdfUrl: objectName,
      fileSize,
    });
    return this.invoiceRepo.save(newInvoice);
  }

  async getBuyerIdFromOrderId(orderId: number): Promise<number> {
    const order = await this.orderRepo.findOneOrFail({
      where: { id: orderId },
      relations: ['buyer'],
    });
    return order.buyer.id;
  }

  private async findOneForInvoice(orderId: number): Promise<Order> {
    const order = await this.orderRepo.findOneOrFail({
      where: { id: orderId },
      withDeleted: true,
      relations: [
        'buyer',
        'address',
        'orderProducts',
        'orderProducts.product',
        'orderProducts.product.brand',
        'checkouts',
      ],
    });
    return order;
  }

  private formatCurrency(amount: number): string {
    if (amount === null || amount === undefined) return '0.00';
    const locale = this.i18nService.t('invoice-generator.locale');
    return new Intl.NumberFormat(locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
      .format(amount)
      .replace(/,/g, ' ');
  }

  prepareInvoiceData(order: OrderForInvoice): InvoiceData {
    const products = order.orderProducts.map((op) => ({
      name: op?.product?.name,
      brand: op?.product?.brand?.label,
      quantity: op?.quantity,
      unitPrice: this.formatCurrency(op?.product?.price),
      total: this.formatCurrency(op?.product?.price * op?.quantity),
    }));

    const subtotal = order.orderProducts.reduce(
      (sum, op) => sum + op.product.price * op.quantity,
      0,
    );

    const totalAmount = subtotal;

    const paymentMethod =
      order?.paymentWay === 'CASH'
        ? this.i18nService.t('invoice-generator.paymentMethod.cash')
        : order.checkouts[0]?.paymentWay ||
          this.i18nService.t('invoice-generator.paymentMethod.epayment');

    const locale = this.i18nService.t('invoice-generator.locale');
    return {
      invoiceNumber: this.generateInvoiceNumber(order.id),
      invoiceDate: new Date().toLocaleDateString(locale),
      deliveryDate: new Date(
        Date.now() + DELIVERY_ESTIMATION_DAYS * 24 * 60 * 60 * 1000,
      ).toLocaleDateString(locale),
      clientName: `${order?.buyer?.name}`,
      clientAddress: `${order.address.street}, ${order.address.district}, ${order.address.city}`,
      clientPhone: order.buyer.phoneNumber,
      paymentMethod: paymentMethod as PaymentMethodType,
      products,
      subtotal: this.formatCurrency(subtotal),
      totalAmount: this.formatCurrency(totalAmount),
    };
  }

  private generateInvoiceNumber(orderId: number): string {
    const year = new Date().getFullYear();
    const paddedId = orderId.toString().padStart(3, '0');
    return `${year}-${paddedId}`;
  }
}

