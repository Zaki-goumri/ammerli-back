
import { Entity, Column, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from 'src/common/entities/base.entity';
import { Order } from 'src/core/order/entities/order.entity';
import { ApiProperty } from '@nestjs/swagger';

export enum InvoiceStatus {
  GENERATED = 'generated',
  SENT = 'sent',
  PAID = 'paid',
  CANCELLED = 'cancelled',
}

@Entity({ name: 'invoices' })
export class Invoice extends BaseEntity {
  @ApiProperty({ description: 'The ID of the order this invoice belongs to.' })
  @Column()
  orderId: number;

  @ManyToOne(() => Order, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'orderId' })
  order: Order;

  @ApiProperty({
    description: 'The unique invoice number (e.g., YYYY-XXX).',
    example: '2025-001',
  })
  @Column({ unique: true })
  invoiceNumber: string;

  @ApiProperty({
    description: 'URL of the generated PDF file in object storage.',
  })
  @Column()
  pdfUrl: string;

  @ApiProperty({ description: 'Size of the PDF file in bytes.' })
  @Column({ type: 'int', nullable: true })
  fileSize: number;

  @ApiProperty({
    enum: InvoiceStatus,
    description: 'The current status of the invoice.',
    default: InvoiceStatus.GENERATED,
  })
  @Column({
    type: 'enum',
    enum: InvoiceStatus,
    default: InvoiceStatus.GENERATED,
  })
  status: InvoiceStatus;
}
