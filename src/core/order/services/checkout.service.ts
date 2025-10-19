import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Checkout } from '../entities/checkout.entity';
import { Repository } from 'typeorm';
import { PaymentWay } from '../enums/payement-way.enum';

@Injectable()
export class CheckoutService {
  constructor(
    @InjectRepository(Checkout)
    private readonly checkoutRepo: Repository<Checkout>,
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
    fees?: number,
    signature?: string,
  ) {
    const checkout = await this.checkoutRepo.update(
      { chargiliCheckoutId },
      { isPaid: true, paymentWay, fees, paidAt: new Date(), signature },
    );
    return checkout;
  }
}
