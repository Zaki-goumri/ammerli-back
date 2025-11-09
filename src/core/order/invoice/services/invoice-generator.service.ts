import {
  Injectable,
  InternalServerErrorException,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as puppeteer from 'puppeteer';
import * as Handlebars from 'handlebars';
import { InvoiceData, InvoiceProduct } from '../interfaces/invoice.interface';
import { Order } from 'src/core/order/entities/order.entity';
import { OrderProduct } from 'src/core/order/entities/product-order.entity';
import { OrderService } from 'src/core/order/services/order.service';
import { ObjectService } from 'src/infrastructure/object-storage/object-storage.service';

@Injectable()
export class InvoiceGeneratorService implements OnModuleInit {
  private readonly logger = new Logger(InvoiceGeneratorService.name);
  private compiledTemplate: Handlebars.TemplateDelegate;
  private templatePath: string;

  constructor(
    private readonly orderService: OrderService,
    private readonly objectService: ObjectService,
  ) {
    this.templatePath = path.join(
      process.cwd(),
      'src/core/order/invoice/templates/invoice.template.hbs',
    );
  }

  async onModuleInit() {
    await this.loadAndCompileTemplate();
    this.logger.log('Invoice HBS template compiled successfully');
  }

  private async loadAndCompileTemplate(): Promise<void> {
    try {
      const templateContent = await fs.readFile(this.templatePath, 'utf-8');
      this.compiledTemplate = Handlebars.compile(templateContent);
    } catch (error) {
      this.logger.error(`Failed to load template: ${this.templatePath}`, error);
      throw new Error(`Template file not found: ${this.templatePath}`);
    }
  }

  async generateInvoice(orderId: number): Promise<{ invoicePath: string; buyerId: number }> {
    const order = await this.orderService.findOneForInvoice(orderId);
    const invoiceData = this.prepareInvoiceData(order);
    const pdfBuffer = await this.generateInvoicePDF(invoiceData);

    const invoiceFileName = `invoice-${orderId}-${Date.now()}.pdf`;
    const invoicePath = await this.objectService.uploadFile(
      {
        buffer: pdfBuffer,
        originalname: invoiceFileName,
        mimetype: 'application/pdf',
        size: pdfBuffer.length,
      },
      { folder: 'invoices' },
    );

    return { invoicePath: invoicePath.fileUrl, buyerId: order.buyer.id };
  }

  async getBuyerIdFromOrderId(orderId: number): Promise<number> {
    const order = await this.orderService.findOneForInvoice(orderId);
    return order.buyer.id;
  }

  async generateInvoicePDF(data: InvoiceData): Promise<Buffer> {
    try {
      const logo = await this.getLogoBase64();
      this.logger.debug('Generating invoice with data:', logo);
      const renderedHtml = this.compiledTemplate({ ...data, logo });
      return await this.generatePDFFromHTML(renderedHtml);
    } catch (error) {
      this.logger.error('Failed to generate invoice PDF', error.stack);
      throw new InternalServerErrorException('Could not generate invoice PDF.');
    }
  }

  private async generatePDFFromHTML(htmlContent: string): Promise<Buffer> {
    let browser: puppeteer.Browser | null = null;
    try {
      browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
        ],
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
      });
      const page = await browser.newPage();

      await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '1cm',
          right: '1cm',
          bottom: '1cm',
          left: '1cm',
        },
      });

      return Buffer.from(pdfBuffer);
    } catch (error) {
      this.logger.error('Puppeteer PDF generation failed:', error);
      throw new InternalServerErrorException('HTML to PDF conversion failed.');
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  formatCurrency(amount: number): string {
    if (amount === null || amount === undefined) return '0.00';
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
      .format(amount)
      .replace(/,/g, ' ');
  }

  prepareInvoiceData(
    order: Order & {
      orderProducts: (OrderProduct & {
        product: { name: string; brand: { label: string }; price: number };
      })[];
    },
  ): InvoiceData {
    const products: InvoiceProduct[] = order.orderProducts.map((op) => ({
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

    return {
      invoiceNumber: this.generateInvoiceNumber(order.id),
      invoiceDate: new Date().toLocaleDateString('fr-FR'),
      deliveryDate: new Date(
        Date.now() + 2 * 24 * 60 * 60 * 1000,
      ).toLocaleDateString('fr-FR'),
      clientName: `${order?.buyer?.name}`,
      clientAddress: `${order.address.street}, ${order.address.city}, ${order.address.district}`,
      clientPhone: order.buyer.phoneNumber,
      paymentMethod: order.payementWay,
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

  private async getLogoBase64(): Promise<string> {
    try {
      const logoPath = path.join(
        process.cwd(),
        'src/core/order/invoice/templates/assets/logo.svg',
      );
      const file = await fs.readFile(logoPath);
      return `data:image/svg+xml;base64,${file.toString('base64')}`;
    } catch (err) {
      this.logger.warn('Logo file not found or failed to load');
      return '';
    }
  }

  createSampleData(): InvoiceData {
    const products: InvoiceProduct[] = [
      {
        name: 'Sample Product 1',
        brand: 'Sample Brand A',
        quantity: 2,
        unitPrice: this.formatCurrency(100),
        total: this.formatCurrency(200),
      },
      {
        name: 'Sample Product 2',
        brand: 'Sample Brand B',
        quantity: 1,
        unitPrice: this.formatCurrency(50.5),
        total: this.formatCurrency(50.5),
      },
    ];

    return {
      invoiceNumber: `2025-SAMP`,
      invoiceDate: '01/01/2025',
      deliveryDate: '03/01/2025',
      clientName: 'John Doe',
      clientAddress: '123 Sample St, Sample City, Sample Country',
      clientPhone: '+1234567890',
      paymentMethod: 'CIB',
      products,
      subtotal: this.formatCurrency(250.5),
      deliveryCost: this.formatCurrency(20),
      totalAmount: this.formatCurrency(270.5),
      amountPaid: this.formatCurrency(0),
      remainingAmount: this.formatCurrency(270.5),
    };
  }
}
