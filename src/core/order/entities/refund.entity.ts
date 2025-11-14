import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Order } from './order.entity';
import { User } from 'src/core/user/entities/user.entity';
import {
  REFUND_STATUS,
  REFUND_STATUS_VALUES,
  RefundStatus,
} from '../enums/refund-status.enum';
import {
  REFUND_REASON,
  REFUND_REASON_VALUES,
  RefundReason,
} from '../enums/refund-reason.enum';

@Entity({ name: 'refunds' })
export class Refund {
  @ApiProperty({ description: 'Unique refund identifier' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: 'Creation timestamp' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ApiProperty({ description: 'Order ID' })
  @Column()
  orderId: number;

  @ManyToOne(() => Order, (order) => order.refunds, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'orderId' })
  order: Order;

  @ApiProperty({ description: 'User who requested refund' })
  @Column()
  requestedBy: number;

  @ManyToOne(() => User, { onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'requestedBy' })
  requester: User;

  @ApiProperty({ description: 'Admin who processed refund' })
  @Column({ nullable: true })
  processedBy?: number;

  @ManyToOne(() => User, { onDelete: 'NO ACTION', nullable: true })
  @JoinColumn({ name: 'processedBy' })
  processor?: User;

  // Refund Details
  @ApiProperty({
    description: 'Amount to refund (can be partial)',
    example: 150.5,
  })
  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;

  @ApiProperty({ description: 'Original order total', example: 500.0 })
  @Column('decimal', { precision: 10, scale: 2 })
  orderTotal: number;

  @ApiProperty({
    enum: REFUND_STATUS_VALUES,
    description: 'Current refund status',
    example: REFUND_STATUS.PENDING,
  })
  @Column({
    type: 'varchar',
    default: REFUND_STATUS.PENDING,
  })
  status: RefundStatus;

  @ApiProperty({
    enum: REFUND_REASON_VALUES,
    description: 'Reason for refund',
    example: REFUND_REASON.ORDER_CANCELLED,
  })
  @Column({ type: 'varchar' })
  reason: RefundReason;

  @ApiProperty({
    description: 'Detailed reason from customer',
    example: 'Order cancelled by customer request',
  })
  @Column({ type: 'text' })
  description: string;

  @ApiProperty({
    description: 'Admin note about refund',
    example: 'Processed via Chargily dashboard',
    nullable: true,
  })
  @Column({ type: 'text', nullable: true })
  adminNote?: string;

  // Timing
  @ApiProperty({ description: 'When refund was requested' })
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  requestedAt: Date;

  @ApiProperty({
    description: 'When admin started processing',
    nullable: true,
  })
  @Column({ type: 'timestamp', nullable: true })
  processingStartedAt?: Date;

  @ApiProperty({ description: 'When refund was completed', nullable: true })
  @Column({ type: 'timestamp', nullable: true })
  completedAt?: Date;

  // Payment Details
  @ApiProperty({
    description: 'Original checkout ID from Chargily',
    nullable: true,
  })
  @Column({ nullable: true })
  checkoutId?: string;

  @ApiProperty({
    description: 'Payment method used',
    example: 'CIB',
  })
  @Column()
  paymentMethod: string;

  @ApiProperty({
    description: 'Transaction reference from Chargily',
    nullable: true,
  })
  @Column({ nullable: true })
  transactionReference?: string;

  // Metadata
  @ApiProperty({
    description: 'Is this a partial refund?',
    example: false,
    default: false,
  })
  @Column({ default: false })
  isPartial: boolean;

  @ApiProperty({
    description: 'Refund attempt number',
    example: 1,
    default: 1,
  })
  @Column({ default: 1 })
  attemptNumber: number;
}
