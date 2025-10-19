import { BadRequestException, Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChargiliService } from 'src/core/chargili/chargili.service';
import { OrderProduct } from '../entities/product-order.entity';
import { Order } from '../entities/order.entity';
import { ProductService } from 'src/core/product/services/product.service';
import { Address } from 'src/core/user/entities/address.entity';
import { ConfigService } from '@nestjs/config';
import { CreateOrderDto } from '../dtos/create-order.dto';
import { Product } from 'src/core/product/entities/product.entity';
import { CheckoutService } from './checkout.service';
import {
  PaginationQueryDto,
  PaginationResponseDto,
} from 'src/common/dtos/pagination.dto';
import { OrderStatus } from '../enums/delivery.enum';

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
    private readonly configService: ConfigService,
    private readonly CheckoutService: CheckoutService,
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

  //TODO: verify if the buyer is the seller
  async createOrderProductWithPayement(
    dto: CreateOrderDto,
    buyerId: number,
    sellerId: number,
  ): Promise<any> {
    const order = await this.entityManager.transaction(async (em) => {
      const products = await this.productService.validateAndReserveStock(
        dto.items,
        em,
      );
      const { totalAmount } = await this.calculateOrderTotals(
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
    if (dto.payementWay === 'CASH') {
      return { order, checkout: null };
    }
    const checkout = await this.createChargilyCheckout(order.totalAmount);
    await this.CheckoutService.createCheckout(order.id, checkout.id);
    return { order, checkout };
  }

  private async calculateOrderTotals(
    products: Product[],
    items: { productId: number; quantity: number }[],
  ) {
    let totalAmount = 0;

    const productMap = new Map(products.map((p) => [p.id, p]));

    for (const item of items) {
      const product = productMap.get(item.productId);
      if (!product) {
        throw new BadRequestException(
          `Product with ID ${item.productId} not found.`,
        );
      }
      totalAmount += product.price * item.quantity;
    }
    return { totalAmount };
  }

  private async createChargilyCheckout(totalAmount: number) {
    const backendApiUrl = this.configService.get<string>('BACKEND_API_URL');
    const backendBaseUrl = this.configService.get<string>('BACKEND_URL');

    const checkout = await this.chargilyService.createCheckout({
      amount: totalAmount,
      currency: 'dzd',
      //NOTE: Update URLs to actual frontend pages in production
      success_url: `${backendBaseUrl}/api-docs`,
      webhook_endpoint: `${backendApiUrl}/order/webhook/chargili`,
      failure_url: `${backendBaseUrl}/api-docs`,
    });
    return checkout;
  }

  async getOrderById(orderId: number): Promise<Order | null> {
    return this.orderRepo.findOne({ where: { id: orderId } });
  }

  async getAllOrders(
    paginationQuery: PaginationQueryDto,
    userId: number,
  ): Promise<
    PaginationResponseDto<{
      id: number;
      totalAmount: number;
      productCount: number;
      status: string;
    }>
  > {
    const { limit, page } = paginationQuery;
    const queryBuilder = this.orderRepo
      .createQueryBuilder('order')
      .where('order.buyerId=:userId', { userId })
      .leftJoin('order_products', 'op', 'op.orderId=order.id')
      .select([
        'order.id AS id',
        'order.totalAmount AS totalAmount',
        'order.status AS status',
        'COUNT(op.id) AS productCount',
      ])
      .groupBy('order.id')
      .orderBy('order.createdAt', 'DESC')
      .take(limit)
      .skip((page - 1) * limit);

    const [data, total] = await Promise.all([
      queryBuilder.getRawMany(),
      this.orderRepo.count(),
    ]);
    return {
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
      },
      data,
    };
  }

  async updateOrderStatus(orderId: number, status: OrderStatus): Promise<void> {
    await this.orderRepo.update({ id: orderId }, { status });
  }
}
