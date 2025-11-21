import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
    console.log(Date.now());
    const order = await this.orderRepo.findOne({
      where: { id: orderId },
    });

    console.log(Date.now());
    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found.`);
    }
    console.log('t1', Date.now());
    const latestTracking = await this.trackingRepo.findOne({
      where: { orderId },
      order: { createdAt: 'DESC' },
    });

    console.log('t2', Date.now());
    if (!latestTracking) {
      throw new NotFoundException(
        `No tracking history found for order with ID ${orderId}.`,
      );
    }

    console.log('t3', Date.now());
    const currentStatusIndex = this.statusSequence.indexOf(
      latestTracking.status,
    );
    if (currentStatusIndex === this.statusSequence.length - 1) {
      throw new BadRequestException('The order has already been delivered.');
    }
    console.log('t4', Date.now());
    const nextStatus = this.statusSequence[currentStatusIndex + 1];
    console.log('t5', Date.now());
    const newTracking = this.trackingRepo.create({
      orderId,
      status: nextStatus,
    });
    console.log('t6', Date.now());
    const savedTracking = await this.trackingRepo.save(newTracking);
    console.log('t7', Date.now());
    const title = `Order Status Update`;
    const body = `Your order #${order.id} is now ${nextStatus}.`;
    await this.notificationsService.sendNotification(
      title,
      body,
      order.buyerId,
      NOTIFICATION_TYPE.STATUS_UPDATE,
    );
    console.log('t8', Date.now());
    return savedTracking;
  }
}
