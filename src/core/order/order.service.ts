import { BadRequestException, Injectable } from '@nestjs/common';
import { EntityManager, In } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrderProduct } from './entities/product-order.entity';
import { Order } from './entities/order.entity';
import { CreateOrderDto } from './dtos/create-order.dto';
import { ProductService } from '../product/services/product.service';
import { Product } from '../product/entities/product.entity';
import { Address } from '../user/entities/address.entity';
import { ChargiliService } from 'src/core/chargili/chargili.service';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    private readonly entityManager: EntityManager,
    @InjectRepository(OrderProduct)
    private readonly orderProductRepo: Repository<OrderProduct>,
    private readonly productService: ProductService,
    private readonly chargilyService: ChargiliService,
  ) {}

  async findProductsByOrder(orderId: number) {
    return this.orderProductRepo.find({
      where: { order: { id: orderId } },
      relations: ['product'],
    });
  }

  async countProductsInOrder(orderId: number) {
    return this.orderProductRepo.count({ where: { order: { id: orderId } } });
  }

  async createOrderProductWithPayement(
    dto: CreateOrderDto,
    buyerId: number,
    sellerId: number,
  ): Promise<{ order: Order; checkoutUrl: string }> {
    const order = await this.entityManager.transaction(async (em) => {
      const products = await this.productService.validateAndReserveStock(
        dto.items,
        em,
      );
      const { totalAmount, totalItems } = await this.calculateOrderTotals(
        products,
        dto.items,
      );
      let address: Address | null = null;
      if (typeof dto.address === 'object') {
        const addressDetailsProvided =
          dto.address && Object.keys(dto.address).length > 0;
        if (addressDetailsProvided) {
          const addressRepo = em.getRepository(Address);
          address = addressRepo.create({ ...dto.address });
          await addressRepo.save(address);
        }
      }

      const orderRepo = em.getRepository(Order);
      const order = orderRepo.create({
        buyerId,
        sellerId,
        totalAmount,
        status: 'PENDING',
        payementWay: dto.payementWay,
        addressId: address ? address.id : (dto.address as number),
      });
      await orderRepo.save(order);

      const orderProductRepo = em.getRepository(OrderProduct);
      const items = dto.items.map((item) =>
        orderProductRepo.create({
          orderId: order.id,
          productId: item.productId,
          quantity: item.quantity,
        }),
      );
      await orderProductRepo.save(items);
      return order;
    });
    const { checkout_url } = await this.createChargilyCheckout(
      order.totalAmount,
    );
    return { order, checkoutUrl: checkout_url };
  }

  private async calculateOrderTotals(
    products: Product[],
    items: { productId: number; quantity: number }[],
  ) {
    let totalAmount = 0;
    let totalItems = 0;

    const productMap = new Map(products.map((p) => [p.id, p]));

    for (const item of items) {
      const product = productMap.get(item.productId);
      if (!product) {
        throw new BadRequestException(
          `Product with ID ${item.productId} not found.`,
        );
      }
      totalAmount += product.price * item.quantity;
      totalItems += item.quantity;
    }
    return { totalAmount, totalItems };
  }
  private async createOrderRecord() {}
  private async createOrderItems() {}
  private async createChargilyCheckout(totalAmount: number) {
    const checkout = await this.chargilyService.createCheckout({
      amount: totalAmount,
      currency: 'dzd',
      success_url: `https://9bd0d76ea3e5.ngrok-free.app/api-docs`,
      webhook_endpoint: `https://9bd0d76ea3e5.ngrok-free.app/order/webhook/chargili`,
    });
    return checkout;
  }
}
