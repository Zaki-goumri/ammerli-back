import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Refund } from '../entities/refund.entity';
import { Order } from '../entities/order.entity';
import { Checkout } from '../entities/checkout.entity';
import { CreateRefundDto } from '../dtos/create-refund.dto';
import { UpdateRefundStatusDto } from '../dtos/update-refund-status.dto';
import { REFUND_STATUS, RefundStatus } from '../enums/refund-status.enum';
import { REFUND_REASON } from '../enums/refund-reason.enum';
import { NotificationsService } from 'src/core/notifications/notifications.service';
import { NOTIFICATION_TYPE } from 'src/core/notifications/enums/notification-type.enum';
import { USER_ROLES } from 'src/common/enums/user-role.enum';
import { UserService } from 'src/core/user/user.service';
import { ORDER_PAYMENT_METHOD } from '../enums/order-payment-method.enum';

@Injectable()
export class RefundService {
  private readonly logger = new Logger(RefundService.name);

  constructor(
    @InjectRepository(Refund)
    private readonly refundRepo: Repository<Refund>,
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    @InjectRepository(Checkout)
    private readonly checkoutRepo: Repository<Checkout>,
    private readonly notificationService: NotificationsService,
    private readonly userService: UserService,
  ) {}

  /**
   * Creates a refund request for an order
   */
  async createRefund(userId: number, dto: CreateRefundDto): Promise<Refund> {
    // Find order with relations
    const order = await this.orderRepo.findOne({
      where: { id: dto.orderId },
      relations: ['buyer'],
    });

    if (!order) {
      throw new NotFoundException(`Order #${dto.orderId} not found`);
    }

    // Validate user owns the order
    if (order.buyerId !== userId) {
      throw new ForbiddenException(
        'You can only request refund for your own orders',
      );
    }

    // Check if order was paid
    if (order.paymentWay !== ORDER_PAYMENT_METHOD.EPAYMENT) {
      throw new BadRequestException('Cannot refund cash orders');
    }

    // Get checkout info
    const checkout = await this.checkoutRepo.findOne({
      where: { orderId: order.id },
      order: { createdAt: 'DESC' },
    });

    if (!checkout || !checkout.isPaid) {
      throw new BadRequestException('Order is not paid yet');
    }

    // Calculate refund amount
    const refundAmount = dto.amount || order.totalAmount;

    // Validate refund amount
    if (refundAmount > order.totalAmount) {
      throw new BadRequestException('Refund amount cannot exceed order total');
    }

    // Check existing refunds
    const existingRefunds = await this.refundRepo.find({
      where: { orderId: order.id, status: REFUND_STATUS.COMPLETED },
    });

    const totalRefunded = existingRefunds.reduce(
      (sum, r) => sum + Number(r.amount),
      0,
    );

    if (totalRefunded + refundAmount > order.totalAmount) {
      throw new BadRequestException(
        `Cannot refund ${refundAmount} DZD. Already refunded ${totalRefunded} DZD`,
      );
    }

    // Get attempt number
    const allRefunds = await this.refundRepo.find({
      where: { orderId: order.id },
    });
    const attemptNumber = allRefunds.length + 1;

    // Create refund record
    const refund = this.refundRepo.create({
      orderId: order.id,
      requestedBy: userId,
      amount: refundAmount,
      orderTotal: order.totalAmount,
      reason: dto.reason,
      description: dto.description,
      status: REFUND_STATUS.PENDING,
      checkoutId: checkout.chargiliCheckoutId,
      paymentMethod: checkout.paymentWay,
      isPartial: refundAmount < order.totalAmount,
      attemptNumber,
      requestedAt: new Date(),
    });

    await this.refundRepo.save(refund);

    this.logger.log(
      `Refund request created: #${refund.id} for order #${order.id} (${refundAmount} DZD)`,
    );

    // Notify admins
    await this.notifyAdminsNewRefund(refund, order);

    return refund;
  }

  /**
   * Updates refund status (Admin only)
   */
  async updateRefundStatus(
    refundId: number,
    adminId: number,
    dto: UpdateRefundStatusDto,
  ): Promise<Refund> {
    const refund = await this.refundRepo.findOne({
      where: { id: refundId },
      relations: ['order', 'order.buyer'],
    });

    if (!refund) {
      throw new NotFoundException(`Refund #${refundId} not found`);
    }

    // Validate status transition
    this.validateStatusTransition(refund.status, dto.status);

    // Update refund
    refund.status = dto.status;
    refund.processedBy = adminId;
    refund.adminNote = dto.adminNote;

    if (
      dto.status === REFUND_STATUS.PROCESSING &&
      !refund.processingStartedAt
    ) {
      refund.processingStartedAt = new Date();
    }

    if (dto.status === REFUND_STATUS.COMPLETED && !refund.completedAt) {
      refund.completedAt = new Date();
    }

    await this.refundRepo.save(refund);

    this.logger.log(
      `Refund #${refundId} status updated to ${dto.status} by admin #${adminId}`,
    );

    // Notify customer
    await this.notifyCustomerRefundStatus(refund);

    return refund;
  }

  /**
   * Gets all pending refunds (Admin only)
   */
  async getPendingRefunds(): Promise<Refund[]> {
    return this.refundRepo.find({
      where: { status: REFUND_STATUS.PENDING },
      relations: ['order', 'order.buyer', 'requester'],
      order: { requestedAt: 'ASC' },
    });
  }

  /**
   * Gets refund by ID
   */
  async getRefundById(refundId: number, userId?: number): Promise<Refund> {
    const refund = await this.refundRepo.findOne({
      where: { id: refundId },
      relations: ['order', 'order.buyer', 'requester', 'processor'],
    });

    if (!refund) {
      throw new NotFoundException(`Refund #${refundId} not found`);
    }

    // If userId provided, check ownership
    if (userId && refund.order.buyerId !== userId) {
      throw new ForbiddenException('You can only view your own refunds');
    }

    return refund;
  }

  /**
   * Gets user's refunds
   */
  async getMyRefunds(userId: number): Promise<Refund[]> {
    return this.refundRepo.find({
      where: { requestedBy: userId },
      relations: ['order'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Gets refunds for an order
   */
  async getOrderRefunds(orderId: number): Promise<Refund[]> {
    return this.refundRepo.find({
      where: { orderId },
      relations: ['requester', 'processor'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Validates status transition
   */
  private validateStatusTransition(
    currentStatus: RefundStatus,
    newStatus: RefundStatus,
  ): void {
    const allowedTransitions: Record<RefundStatus, RefundStatus[]> = {
      [REFUND_STATUS.PENDING]: [
        REFUND_STATUS.PROCESSING,
        REFUND_STATUS.CANCELLED,
        REFUND_STATUS.FAILED,
      ],
      [REFUND_STATUS.PROCESSING]: [
        REFUND_STATUS.COMPLETED,
        REFUND_STATUS.FAILED,
      ],
      [REFUND_STATUS.COMPLETED]: [],
      [REFUND_STATUS.FAILED]: [REFUND_STATUS.PENDING],
      [REFUND_STATUS.CANCELLED]: [],
    };

    if (!allowedTransitions[currentStatus].includes(newStatus)) {
      throw new BadRequestException(
        `Cannot transition from ${currentStatus} to ${newStatus}`,
      );
    }
  }

  /**
   * Notifies admins about new refund request
   */
  private async notifyAdminsNewRefund(
    refund: Refund,
    order: Order,
  ): Promise<void> {
    try {
      const admins = await this.userService.findUsersByRole(USER_ROLES.ADMIN);

      await Promise.all(
        admins.map((admin) =>
          this.notificationService
            .sendNotification(
              'notifications.refund.new_request.title',
              'notifications.refund.new_request.body',
              admin.id,
              NOTIFICATION_TYPE.ORDERS,
              { orderId: order.id, amount: refund.amount },
            )
            .catch((error) => {
              this.logger.error(
                `Failed to send notification to admin ${admin.id}`,
                error,
              );
              return null;
            }),
        ),
      );
    } catch (error) {
      this.logger.error('Failed to notify admins about refund', error);
    }
  }

  /**
   * Notifies customer about refund status change
   */
  private async notifyCustomerRefundStatus(refund: Refund): Promise<void> {
    try {
      const statusMap = {
        [REFUND_STATUS.PROCESSING]: {
          titleKey: 'notifications.refund.processing.title',
          bodyKey: 'notifications.refund.processing.body',
          data: { amount: refund.amount },
        },
        [REFUND_STATUS.COMPLETED]: {
          titleKey: 'notifications.refund.completed.title',
          bodyKey: 'notifications.refund.completed.body',
          data: { amount: refund.amount },
        },
        [REFUND_STATUS.FAILED]: {
          titleKey: 'notifications.refund.failed.title',
          bodyKey: 'notifications.refund.failed.body',
          data: { adminNote: refund.adminNote || 'Please contact support.' },
        },
        [REFUND_STATUS.CANCELLED]: {
          titleKey: 'notifications.refund.cancelled.title',
          bodyKey: 'notifications.refund.cancelled.body',
          data: { adminNote: refund.adminNote || '' },
        },
      };

      const notification = statusMap[refund.status];

      if (notification) {
        await this.notificationService.sendNotification(
          notification.titleKey,
          notification.bodyKey,
          refund.order.buyerId,
          NOTIFICATION_TYPE.ORDERS,
          notification.data,
        );
      }
    } catch (error) {
      this.logger.error('Failed to notify customer about refund', error);
    }
  }

  /**
   * Creates refund for cancelled order (used internally by OrderService)
   */
  async createRefundForCancelledOrder(
    orderId: number,
    userId: number,
    cancelledBy: string,
    reason: string,
  ): Promise<Refund | null> {
    const order = await this.orderRepo.findOne({
      where: { id: orderId },
    });

    if (!order || order.paymentWay !== ORDER_PAYMENT_METHOD.EPAYMENT) {
      return null;
    }

    const checkout = await this.checkoutRepo.findOne({
      where: { orderId },
      order: { createdAt: 'DESC' },
    });

    if (!checkout || !checkout.isPaid) {
      return null;
    }

    const refund = this.refundRepo.create({
      orderId,
      requestedBy: userId,
      amount: order.totalAmount,
      orderTotal: order.totalAmount,
      reason: REFUND_REASON.ORDER_CANCELLED,
      description: `Order cancelled by ${cancelledBy}. Reason: ${reason}`,
      status: REFUND_STATUS.PENDING,
      checkoutId: checkout.chargiliCheckoutId,
      paymentMethod: checkout.paymentWay,
      isPartial: false,
      attemptNumber: 1,
      requestedAt: new Date(),
    });

    await this.refundRepo.save(refund);

    this.logger.log(
      `Auto-created refund #${refund.id} for cancelled order #${orderId}`,
    );

    await this.notifyAdminsNewRefund(refund, order);

    return refund;
  }
}
