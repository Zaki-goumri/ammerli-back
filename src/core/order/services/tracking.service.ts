import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { Tracking } from '../entities/tracking.entity';
import { Order } from '../entities/order.entity';
import { ORDER_STATUS, OrderStatus } from '../enums/delivery.enum';
import { OnEvent } from '@nestjs/event-emitter';
import { SendTrackingDto } from '../dtos/send-tracking.dto';
import { NotificationsService } from 'src/core/notifications/notifications.service';
import { NOTIFICATION_TYPE } from 'src/core/notifications/enums/notification-type.enum';

@Injectable()
export class TrackingService {
  private readonly statusSequence: OrderStatus[] = [
    ORDER_STATUS.CONFIRMATION,
    ORDER_STATUS.PREPARATION,
    ORDER_STATUS.ON_DELIVERING,
    ORDER_STATUS.DELIVERED,
  ];

  logger = new Logger(TrackingService.name);
  constructor(
    @InjectRepository(Tracking)
    private readonly trackingRepo: Repository<Tracking>,
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    private readonly notificationsService: NotificationsService,
    private readonly entityManager: EntityManager,
  ) {}

  @OnEvent('order.paid', { async: true })
  async createInitialTracking(orderId: number): Promise<Tracking> {
    this.logger.log(`Creating initial tracking for order ID: ${orderId}`);
    const tracking = this.trackingRepo.create({
      orderId,
      status: ORDER_STATUS.CONFIRMATION,
    });
    return this.trackingRepo.save(tracking);
  }

  async getTrackingHistory(
    orderId: number,
    userId: number,
  ): Promise<SendTrackingDto[]> {
    const { id } = await this.orderRepo.findOneOrFail({
      where: { id: orderId, buyerId: userId },
      select: ['id'],
    });

    return this.trackingRepo.find({
      where: { orderId: id },
      order: { createdAt: 'ASC' },
      select: ['status', 'createdAt'],
    });
  }

  async addNextTrackingStatus(orderId: number): Promise<Tracking> {
    const result = await this.entityManager.transaction(
      async (transactionalEntityManager) => {
        try {
          const latestTracking = await transactionalEntityManager.findOne(
            Tracking,
            {
              where: { orderId },
              relations: ['order'],
              order: { createdAt: 'DESC' },
            },
          );
          if (!latestTracking) {
            throw new NotFoundException(
              `No tracking history found for order with ID ${orderId}.`,
            );
          }
          if (!latestTracking.order) {
            throw new NotFoundException(`Order with ID ${orderId} not found.`);
          }

          const currentStatusIndex = this.statusSequence.indexOf(
            latestTracking.status,
          );

          if (currentStatusIndex === this.statusSequence.length - 1) {
            throw new BadRequestException(
              'The order has already been delivered.',
            );
          }

          const nextStatus = this.statusSequence[currentStatusIndex + 1];
          const newTracking = transactionalEntityManager.create(Tracking, {
            orderId,
            status: nextStatus,
          });

          const savedTracking =
            await transactionalEntityManager.save(newTracking);

          return { savedTracking, order: latestTracking.order, nextStatus };
        } catch (error) {
          console.error(
            `Failed to update tracking status for order ${orderId}:`,
            error,
          );
          if (
            error instanceof NotFoundException ||
            error instanceof BadRequestException
          ) {
            throw error;
          }
          throw new InternalServerErrorException(
            `Failed to update tracking status for order ${orderId}. Please try again later.`,
          );
        }
      },
    );
    await this.notificationsService.sendNotification(
      'notifications.order.status_updated.title',
      'notifications.order.status_updated.body',
      result.order.buyerId,
      NOTIFICATION_TYPE.STATUS_UPDATE,
      { orderId: result.order.id, status: result.nextStatus },
    );
    return result.savedTracking;
  }
}
