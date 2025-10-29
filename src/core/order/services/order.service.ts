import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChargiliService } from 'src/core/chargili/chargili.service';
import { OrderProduct } from '../entities/product-order.entity';
import { Order } from '../entities/order.entity';
import { ProductService } from 'src/core/product/services/product.service';
import { Address } from 'src/core/user/entities/address.entity';
import { ConfigService } from '@nestjs/config';
import { OrderListItemDto } from '../dtos/order-list-item.dto';
import { ProductOrderItemDto } from '../dtos/product-order-item.dto';
import { CreateOrderResDto } from '../dtos/create-order.res.dto';
import { CreateOrderDto } from '../dtos/create-order.dto';
import { Product } from 'src/core/product/entities/product.entity';
import { CheckoutService } from './checkout.service';
import {
  PaginationQueryDto,
  PaginationResponseDto,
} from 'src/common/dtos/pagination.dto';
import { UserService } from 'src/core/user/user.service';
import { CreateCheckoutRes } from '../dtos/checkout-create-res.dto';
import { Tracking } from '../entities/tracking.entity';
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
    private readonly userService: UserService,
    @InjectRepository(Tracking)
    private readonly trackingRepo: Repository<Tracking>,
  ) {}

  async findProductsByOrder(orderId: number) {
    return this.orderProductRepo.find({
      where: { order: { id: orderId } },
      relations: ['product'],
    });
  }

  async findProductsByOrderId(
    orderId: number,
    userId: number,
  ): Promise<ProductOrderItemDto[]> {
    const products = await this.orderProductRepo
      .createQueryBuilder('op')
      .innerJoin('op.order', 'o')
      .where('op.orderId = :orderId', { orderId })
      .andWhere('o.buyerId = :userId', { userId })
      .leftJoin('op.product', 'p')
      .leftJoin('p.pictures', 'mainPicture', 'mainPicture.isMain = TRUE')
      .select([
        'p.id AS id',
        'p.name AS name',
        'p.price AS price',
        'op.quantity AS quantity',
        'mainPicture.url AS picture',
      ])
      .getRawMany();

    if (products.length > 0) {
      return products;
    }

    const order = await this.orderRepo.findOneBy({ id: orderId });
    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found.`);
    }
    // If order exists, but products are empty, it means the user is not the buyer
    throw new NotFoundException(
      `Order with ID ${orderId} not found for the current user.`,
    );
  }

  async countProductsInOrder(orderId: number) {
    return this.orderProductRepo.count({ where: { order: { id: orderId } } });
  }

  async createOrderProductWithPayement(
    dto: CreateOrderDto,
    buyerId: number,
  ): Promise<CreateOrderResDto> {
    const order = await this.entityManager.transaction(async (em) => {
      const products = await this.productService.validateAndReserveStock(
        dto.items,
        em,
      );
      const { totalAmount } = await this.calculateOrderTotals(
        products,
        dto.items,
      );
      let addressId: number;
      if (dto.addressId) {
        const address = await em.getRepository(Address).findOneOrFail({
          where: { id: dto.addressId, userId: buyerId },
        });
        addressId = address.id;
      } else if (dto.address) {
        const newAddress = await this.userService.createAddress(
          buyerId,
          dto.address,
        );
        addressId = newAddress.id;
      } else {
        throw new BadRequestException(
          'Either addressId or address must be provided',
        );
      }
      const orderRepo = em.getRepository(Order);
      const order = orderRepo.create({
        buyerId,
        totalAmount,
        payementWay: dto.payementWay,
        addressId,
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
      return { order, checkoutUrl: null };
    }
    const { checkoutId, checkoutUrl } = await this.createChargilyCheckout(
      order.totalAmount,
      order.id,
    );
    await this.CheckoutService.createCheckout(order.id, checkoutId);
    return { order, checkoutUrl };
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

  private async createChargilyCheckout(
    totalAmount: number,
    orderId?: number,
  ): Promise<CreateCheckoutRes> {
    const backendApiUrl = this.configService.get<string>('BACKEND_API_URL');
    const backendBaseUrl = this.configService.get<string>('BACKEND_BASE_URL');

    console.log('Backend API URL:', backendApiUrl);
    const checkout = await this.chargilyService.createCheckout({
      amount: totalAmount,
      currency: 'dzd',
      //NOTE: Update URLs to actual frontend pages in production
      success_url: `${backendApiUrl}/order/redirect/${orderId}`,
      webhook_endpoint: `${backendApiUrl}/order/webhook/chargili`,
      failure_url: `${backendApiUrl}/order/redirect/${orderId}`,
    });
    return { checkoutUrl: checkout.checkout_url, checkoutId: checkout.id };
  }

  async getOrderById(orderId: number): Promise<Order | null> {
    return this.orderRepo.findOne({ where: { id: orderId } });
  }

  async getAllOrders(
    paginationQuery: PaginationQueryDto,
    userId: number,
    withProducts: boolean = false,
  ): Promise<PaginationResponseDto<OrderListItemDto>> {
    const { limit, page } = paginationQuery;

    const queryBuilder = this.orderRepo
      .createQueryBuilder('orders')
      .where('orders.buyerId = :userId', { userId })
      .leftJoin(
        (subQuery) =>
          subQuery
            .select('t1.orderId', 'orderId')
            .addSelect('t1.status', 'latestStatus')
            .from(Tracking, 't1')
            .innerJoin(
              (innerSubquery) => {
                return innerSubquery
                  .select('MAX(t2.createdAt)', 'maxCreatedAt')
                  .addSelect('t2.orderId', 'order_id_alias')
                  .from(Tracking, 't2')
                  .groupBy('t2.orderId');
              },
              't_max',
              't_max.order_id_alias = t1.orderId AND t_max."maxCreatedAt" = t1.createdAt',
            ),
        'latest_tracking',
        'latest_tracking."orderId" = orders.id',
      )

      .leftJoin('order_products', 'op', 'op.orderId = orders.id')
      .select([
        'orders.id AS id',
        'orders.totalAmount AS totalAmount',
        'orders.createdAt AS createdAt',
        'orders.updatedAt AS updatedAt',
        'latest_tracking."latestStatus" AS status',
        'COUNT(op.id) AS productCount',
      ])
      .groupBy('orders.id')
      .addGroupBy('latest_tracking."latestStatus"')
      .orderBy('orders.createdAt', 'DESC')
      .take(limit)
      .skip((page - 1) * limit);

    const [data, total] = await Promise.all([
      queryBuilder.getRawMany(),
      this.orderRepo.count({ where: { buyerId: userId } }),
    ]);

    const orders: OrderListItemDto[] = data.map((d) => ({
      id: d.id,
      totalAmount: parseFloat(d.totalAmount),
      status: d?.status as OrderStatus,
      productCount: parseInt(d.productcount, 10),
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
    })) as OrderListItemDto[];

    if (withProducts && orders.length > 0) {
      const orderIds = orders.map((o) => o.id);
      const products = await this.orderProductRepo
        .createQueryBuilder('op')
        .leftJoin('op.product', 'p')
        .leftJoin('p.pictures', 'pic', 'pic.isMain = :isMain', { isMain: true })
        .where('op.orderId IN (:...orderIds)', { orderIds })
        .select([
          'op.orderId AS orderId',
          'p.id AS id',
          'p.name AS name',
          'p.price AS price',
          'op.quantity AS quantity',
          'pic.url AS picture',
        ])
        .getRawMany();

      const productsByOrderId = products.reduce(
        (acc, p) => {
          if (!acc[p.orderId]) {
            acc[p.orderId] = [];
          }
          const { orderId, ...productData } = p;
          acc[p.orderId].push({
            ...productData,
            price: parseFloat(productData.price),
          });
          return acc;
        },
        {} as Record<number, ProductOrderItemDto[]>,
      );

      for (const order of orders) {
        order.products = productsByOrderId[order.id] || [];
      }
    }
    return {
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
      },
      data: orders,
    };
  }
}
