import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Checkout } from '../entities/checkout.entity';
import { Repository } from 'typeorm';
import { PaymentWay } from '../enums/payment-way.enum';
import { Order } from '../entities/order.entity';
import { ORDER_PAYMENT_METHOD } from '../enums/order-payment-method.enum';

@Injectable()
export class CheckoutService {
  constructor(
    @InjectRepository(Checkout)
    private readonly checkoutRepo: Repository<Checkout>,
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
  ) {}

  async createCheckout(orderId: number, chargiliCheckoutId: string) {
    const checkout = this.checkoutRepo.create({
      orderId,
      chargiliCheckoutId,
    });
    return this.checkoutRepo.save(checkout);
  }

  async updateCheckoutStatus(
    chargiliCheckoutId: string,
    paymentWay: PaymentWay,
    isPaid: boolean,
    fees?: number,
    signature?: string,
  ) {
    await this.checkoutRepo.update(
      { chargiliCheckoutId },
      { isPaid, paymentWay, fees, paidAt: new Date(), signature },
    );

    const checkoutRecord = await this.checkoutRepo.findOne({
      where: { chargiliCheckoutId },
      relations: ['order'],
    });

    if (checkoutRecord && checkoutRecord.order) {
      if (checkoutRecord.order.paymentWay === 'EPAYMENT') {
        await this.orderRepo.update(
          { id: checkoutRecord.order.id },
          { paymentWay: ORDER_PAYMENT_METHOD.EPAYMENT },
        );
      }
    }
  }
  async findBuyerIdByCheckoutId(chargiliCheckoutId: string): Promise<number> {
    const { order } = await this.checkoutRepo.findOneOrFail({
      where: { chargiliCheckoutId },
      relations: ['order'],
      select: { order: { buyerId: true } },
    });
    const buyerId = order.buyerId;
    return buyerId;
  }

  async findOrderIdByCheckoutId(chargiliCheckoutId: string): Promise<number> {
    const { order } = await this.checkoutRepo.findOneOrFail({
      where: { chargiliCheckoutId },
      relations: ['order'],
      select: { order: { id: true } },
    });
    const orderId = order.id;
    return orderId;
  }
}
