import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tracking } from '../entities/tracking.entity';
import { Order } from '../entities/order.entity';
import { ORDER_STATUS, OrderStatus } from '../enums/delivery.enum';

@Injectable()
export class TrackingService {
  private readonly statusSequence: OrderStatus[] = [
    ORDER_STATUS.CONFIRMATION,
    ORDER_STATUS.PREPARATION,
    ORDER_STATUS.ON_DELIVERING,
    ORDER_STATUS.DELIVERED,
  ];

  constructor(
    @InjectRepository(Tracking)
    private readonly trackingRepo: Repository<Tracking>,
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
  ) {}

  async createInitialTracking(orderId: number): Promise<Tracking> {
    const tracking = this.trackingRepo.create({
      orderId,
      status: ORDER_STATUS.CONFIRMATION,
    });
    return this.trackingRepo.save(tracking);
  }

  async getTrackingHistory(orderId: number, userId: number): Promise<Tracking[]> {
    const order = await this.orderRepo.findOne({ where: { id: orderId, buyerId: userId } });
    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found for the current user.`);
    }
    return this.trackingRepo.find({ where: { orderId }, order: { createdAt: 'ASC' } });
  }

  async addNextTrackingStatus(orderId: number): Promise<Tracking> {
    const latestTracking = await this.trackingRepo.findOne({
      where: { orderId },
      order: { createdAt: 'DESC' },
    });

    if (!latestTracking) {
      throw new NotFoundException(`No tracking history found for order with ID ${orderId}.`);
    }

    const currentStatusIndex = this.statusSequence.indexOf(latestTracking.status);
    if (currentStatusIndex === this.statusSequence.length - 1) {
      throw new BadRequestException('The order has already been delivered.');
    }

    const nextStatus = this.statusSequence[currentStatusIndex + 1];
    const newTracking = this.trackingRepo.create({
      orderId,
      status: nextStatus,
    });

    return this.trackingRepo.save(newTracking);
  }
}
