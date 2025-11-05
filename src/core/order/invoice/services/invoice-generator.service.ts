import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as Mustache from 'mustache';

import { InvoiceData, InvoiceProduct } from '../interfaces/invoice.interface';
import { Order } from 'src/core/order/entities/order.entity';
import { OrderProduct } from 'src/core/order/entities/product-order.entity';
import { spawn } from 'child_process';

@Injectable()
export class InvoiceGeneratorService {
  private readonly logger = new Logger(InvoiceGeneratorService.name);
  private templateCache: string | null = null;

  /**
   * Generates a PDF invoice from order data.
   * @param data - The data for the invoice.
   * @returns A promise that resolves with the PDF buffer.
   */
  async generateInvoicePDF(data: InvoiceData): Promise<Buffer> {
    try {
      const template = await this.loadTemplate();
      const renderedLatex = Mustache.render(template, data);
      return await this.compileLatexToPdf(renderedLatex);
    } catch (error) {
      this.logger.error('Failed to generate invoice PDF', error.stack);
      throw new InternalServerErrorException('Could not generate invoice PDF.');
    }
  }

  /**
   * Loads the LaTeX template from the file system.
   */
  private async loadTemplate(): Promise<string> {
    if (this.templateCache) return this.templateCache;

    const templatePath = path.join(
      __dirname,
      '..',
      'templates',
      'invoice.template.tex',
    );

    try {
      this.templateCache = await fs.readFile(templatePath, 'utf-8');
      return this.templateCache;
    } catch (error) {
      this.logger.error(
        `Template file not found at ${templatePath}`,
        error.stack,
      );
      throw new InternalServerErrorException('Invoice template not found.');
    }
  }

  /**
   * Compiles LaTeX content to a PDF buffer using pdflatex.
   */
  private compileLatexToPdf(latexContent: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const tempDir = path.join(__dirname, '..', '..', '..', '..', 'temp');
      const tempFileName = `invoice-${Date.now()}`;
      const texFilePath = path.join(tempDir, `${tempFileName}.tex`);
      const pdfFilePath = path.join(tempDir, `${tempFileName}.pdf`);

      fs.mkdir(tempDir, { recursive: true })
        .then(() => fs.writeFile(texFilePath, latexContent, 'utf8'))
        .then(() => {
          const pdflatex = spawn('pdflatex', [
            '-interaction=nonstopmode',
            '-halt-on-error',
            '-output-directory',
            tempDir,
            texFilePath,
          ]);

          let stdout = '';
          let stderr = '';

          pdflatex.stdout.on('data', (data) => {
            stdout += data.toString();
          });

          pdflatex.stderr.on('data', (data) => {
            stderr += data.toString();
          });

          pdflatex.on('close', async (code) => {
            if (code === 0) {
              try {
                const pdfBuffer = await fs.readFile(pdfFilePath);
                resolve(pdfBuffer);
              } catch (readError) {
                this.logger.error(
                  'Failed to read generated PDF:',
                  readError.message,
                );
                reject(
                  new InternalServerErrorException(
                    'Failed to read generated PDF.',
                  ),
                );
              } finally {
                // Clean up temporary files
                await fs
                  .unlink(texFilePath)
                  .catch((err) =>
                    this.logger.error(
                      'Failed to delete .tex file:',
                      err.message,
                    ),
                  );
                await fs
                  .unlink(pdfFilePath)
                  .catch((err) =>
                    this.logger.error(
                      'Failed to delete .pdf file:',
                      err.message,
                    ),
                  );
                await fs
                  .unlink(path.join(tempDir, `${tempFileName}.log`))
                  .catch((err) =>
                    this.logger.error(
                      'Failed to delete .log file:',
                      err.message,
                    ),
                  );
                await fs
                  .unlink(path.join(tempDir, `${tempFileName}.aux`))
                  .catch((err) =>
                    this.logger.error(
                      'Failed to delete .aux file:',
                      err.message,
                    ),
                  );
              }
            } else {
              this.logger.error('pdflatex compilation failed:', {
                code,
                stdout,
                stderr,
              });
              reject(
                new InternalServerErrorException('LaTeX compilation failed.'),
              );
              // Clean up temporary files even on error
              await fs
                .unlink(texFilePath)
                .catch((err) =>
                  this.logger.error('Failed to delete .tex file:', err.message),
                );
              await fs
                .unlink(pdfFilePath)
                .catch((err) =>
                  this.logger.error('Failed to delete .pdf file:', err.message),
                );
              await fs
                .unlink(path.join(tempDir, `${tempFileName}.log`))
                .catch((err) =>
                  this.logger.error('Failed to delete .log file:', err.message),
                );
              await fs
                .unlink(path.join(tempDir, `${tempFileName}.aux`))
                .catch((err) =>
                  this.logger.error('Failed to delete .aux file:', err.message),
                );
            }
          });

          pdflatex.on('error', (err) => {
            this.logger.error('Failed to start pdflatex process:', err.message);
            reject(
              new InternalServerErrorException(
                'Failed to start LaTeX compiler.',
              ),
            );
          });
        })
        .catch((err) => {
          this.logger.error(
            'Failed to prepare temporary directory or write .tex file:',
            err.message,
          );
          reject(
            new InternalServerErrorException(
              'Failed to prepare for LaTeX compilation.',
            ),
          );
        });
    });
  }

  /**
   * Formats a number into a French-style currency string.
   */
  formatCurrency(amount: number): string {
    if (amount === null || amount === undefined) return '0.00';
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
      .format(amount)
      .replace(/,/g, ' ');
  }

  /**
   * Prepares the invoice data from an order entity.
   */
  prepareInvoiceData(
    order: Order & {
      orderProducts: (OrderProduct & {
        product: { name: string; brand: { name: string }; price: number };
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

    const deliveryCost = (order as any).deliveryCost || 0;
    const totalAmount = subtotal + deliveryCost;

    const amountPaid = (order as any).amountPaid || 0;
    const remainingAmount = totalAmount - amountPaid;

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
      deliveryCost: this.formatCurrency(deliveryCost),
      totalAmount: this.formatCurrency(totalAmount),
      amountPaid: this.formatCurrency(amountPaid),
      remainingAmount: this.formatCurrency(remainingAmount),
    };
  }

  /**
   * Generates an invoice number from an order ID.
   */
  private generateInvoiceNumber(orderId: number): string {
    const year = new Date().getFullYear();
    const paddedId = orderId.toString().padStart(3, '0');
    return `${year}-${paddedId}`;
  }

  /**
   * Creates sample data for testing purposes.
   */
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
