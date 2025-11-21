import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Res,
  ParseIntPipe,
  UseGuards,
  Header,
  Logger,
  UseInterceptors,
} from '@nestjs/common';
import { InvoiceService } from './services/invoice.service';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { Response } from 'express';
import { USER_ROLES } from 'src/common/enums/user-role.enum';
import { Roles } from 'src/core/authentication/decorators/role.decorator';
import { AccessTokenGuard } from 'src/core/authentication/guards/access-token.guard';
import { RoleGuard } from 'src/core/authentication/guards/role.guard';
import { InvoiceGeneratorService } from './services/invoice-generator.service';
import { USER } from '../authentication/decorators/user.decorartor';
import { PresignedUrlInterceptor } from 'src/common/interceptors/presigned-url.interceptor';
import { ConvertToPresignedUrls } from 'src/common/decorators/convert-to-presigned-urls.decorator';
import { BUCKET_TARGETS } from 'src/common/constants/buckets';

@ApiTags('invoices')
@Controller('invoices')
@UseGuards(AccessTokenGuard, RoleGuard)
export class InvoiceController {
  private readonly logger = new Logger(InvoiceController.name);

  constructor(
    private readonly invoiceService: InvoiceService,
    private readonly invoiceGeneratorService: InvoiceGeneratorService,
  ) {}

  @Post('generate/:orderId')
  @UseGuards(AccessTokenGuard, RoleGuard)
  @Roles(USER_ROLES.ADMIN)
  @ApiOperation({ summary: 'Generate an invoice for an order' })
  @ApiResponse({
    status: 201,
    description: 'The invoice has been successfully generated.',
  })
  generate(@Param('orderId', ParseIntPipe) orderId: number) {
    this.logger.log(`Generating invoice for order ID: ${orderId}`);
    return this.invoiceService.generateInvoiceForOrder(orderId);
  }

  @Get()
  @Roles(USER_ROLES.ADMIN)
  @ApiOperation({ summary: 'Get all invoices (admin)' })
  findAll() {
    return this.invoiceService.findAll();
  }

  @UseInterceptors(PresignedUrlInterceptor)
  @Get('user')
  @ConvertToPresignedUrls(['pdfUrl'], BUCKET_TARGETS.INVOICES)
  @ApiOperation({ summary: 'Get all invoices for a specific user' })
  findUserInvoices(@USER('id') userId: number) {
    return this.invoiceService.getManyInvoicesForUser(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single invoice by ID' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.invoiceService.findOne(id);
  }

  @Get('order/:orderId')
  @ApiOperation({ summary: 'Get an invoice by order ID' })
  findByOrderId(@Param('orderId', ParseIntPipe) orderId: number) {
    return this.invoiceService.findByOrderId(orderId);
  }

  @Get(':id/download')
  @ApiOperation({ summary: 'Download the invoice as a PDF file' })
  async download(@Param('id', ParseIntPipe) id: number, @Res() res: Response) {
    const pdfBuffer = await this.invoiceService.getInvoicePDF(id);
    const invoice = await this.invoiceService.findOne(id);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=invoice-${invoice.invoiceNumber}.pdf`,
    );
    res.send(pdfBuffer);
  }

  @Get(':id/preview')
  @ApiOperation({ summary: 'Preview the invoice in the browser' })
  async preview(@Param('id', ParseIntPipe) id: number, @Res() res: Response) {
    const pdfBuffer = await this.invoiceService.getInvoicePDF(id);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename=invoice.pdf');
    res.send(pdfBuffer);
  }

  @Post(':id/regenerate')
  @UseGuards(AccessTokenGuard, RoleGuard)
  @Roles(USER_ROLES.ADMIN)
  @ApiOperation({ summary: 'Regenerate the invoice PDF' })
  regenerate(@Param('id', ParseIntPipe) id: number) {
    this.logger.log(`Regenerating invoice ID: ${id}`);
    return this.invoiceService.regenerateInvoice(id);
  }

  @Delete(':id')
  @UseGuards(AccessTokenGuard, RoleGuard)
  @Roles(USER_ROLES.ADMIN)
  @ApiOperation({ summary: 'Delete an invoice' })
  remove(@Param('id', ParseIntPipe) id: number) {
    this.logger.log(`Deleting invoice ID: ${id}`);
    return this.invoiceService.delete(id);
  }

  @Get('test/sample')
  @Header('Content-Type', 'application/pdf')
  @Header('Content-Disposition', 'inline; filename=sample-invoice.pdf')
  @ApiOperation({ summary: 'Generate a sample PDF for testing' })
  async getSamplePdf(@Res() res: Response) {
    const sampleData = this.invoiceGeneratorService.createSampleData();
    const pdfBuffer =
      await this.invoiceGeneratorService.generateInvoicePDF(sampleData);
    res.send(pdfBuffer);
  }
}
