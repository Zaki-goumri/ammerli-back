import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { EntityManager, IsNull, LessThan } from 'typeorm';
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
import { CreateOrderResponseDto } from '../dtos/create-order-response.dto';
import { CreateOrderDto } from '../dtos/create-order.dto';
import { Product } from 'src/core/product/entities/product.entity';
import { CheckoutService } from './checkout.service';
import {
  PaginationQueryDto,
  PaginationResponseDto,
} from 'src/common/dtos/pagination.dto';
import { UserService } from 'src/core/user/user.service';
import { ORDER_PAYMENT_METHOD } from '../enums/order-payment-method.enum';
import { CreateCheckoutRes } from '../dtos/checkout-create-res.dto';
import { Tracking } from '../entities/tracking.entity';
import { ORDER_STATUS, OrderStatus } from '../enums/delivery.enum';
import { OrderForAdminListItemDto } from '../dtos/order-for-admin-list-item.dto';
import { PaymentInfoDto } from '../dtos/payment-info.dto';
import { BuyerInfoDto } from '../dtos/buyer-info.dto';
import { TrackingService } from './tracking.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { QUEUE_NAME } from 'src/common/constants/queues';
import { INVOICE_JOBS } from 'src/common/constants/jobs';

import { NotificationsService } from 'src/core/notifications/notifications.service';
import { RedisService } from 'nestjs-redis-client';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { NOTIFICATION_TYPE } from 'src/core/notifications/enums/notification-type.enum';
import { CheckoutDataDto } from 'src/core/chargili/dtos/chargili-webhook.dto';
import { extractCheckoutIdFromUrl } from '../utils/extract-checkout-id.utils';
import { Logger } from '@nestjs/common';
import { PaymentWay } from '../enums/payment-way.enum';
import { RefundService } from './refund.service';
import { ObjectService } from 'src/infrastructure/object-storage/object-storage.service';
import { BUCKET_TARGETS } from 'src/common/constants/buckets';
import { Cron, CronExpression } from '@nestjs/schedule';
import { I18nService } from 'nestjs-i18n';
import { OrderStatusQuery } from '../enums/order-status-query.enum';

export type PaymentStatus =
  | 'paid'
  | 'failed'
  | 'canceled'
  | 'pending'
  | 'error';
export type CurrencyCode = 'dzd';

export interface PaymentClientData {
  orderId: number;
  status: string;
  amount: number;
  currency: CurrencyCode;
  paymentMethod: string | null | undefined;
  errorMessage?: string;
}

@Injectable()
export class OrderService {
  logger = new Logger(OrderService.name);
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
    private readonly trackingService: TrackingService,
    @InjectQueue(QUEUE_NAME.INVOICE)
    private readonly invoiceQueue: Queue,
    private readonly notificationService: NotificationsService,
    private readonly eventEmitter: EventEmitter2,
    private readonly redisService: RedisService,
    private readonly refundService: RefundService,
    private readonly objectStorageService: ObjectService,
    private readonly i18nService: I18nService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async clearOldUnpaidCheckouts() {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDay() - 1);

    this.logger.log(
      `Clearing unpaid checkouts created before ${cutoffDate.toISOString()}`,
    );
    const ordersToDelete = await this.orderRepo
      .createQueryBuilder('order')
      .leftJoin('order.checkouts', 'checkout')
      .where('order.createdAt < :cutoffDate', { cutoffDate })
      .andWhere('order.paymentWay = :paymentWay', {
        paymentWay: ORDER_PAYMENT_METHOD.EPAYMENT,
      })
      .andWhere('checkout."isPaid" = FALSE')
      .getMany();

    if (ordersToDelete.length > 0) {
      await this.orderRepo.remove(ordersToDelete);
      this.logger.log(`Removed ${ordersToDelete.length} expired unpaid orders`);
    } else {
      this.logger.log('No expired unpaid orders to remove');
    }
  }

  async processWebhook(
    data: CheckoutDataDto,
    signature: string,
  ): Promise<void> {
    this.logger.log('Processing Chargili webhook in service');
    const checkoutId = extractCheckoutIdFromUrl(data.checkout_url);
    if (!checkoutId) {
      this.logger.error({
        message: 'Invalid checkout URL received in webhook',
        checkoutUrl: data.checkout_url,
        context: 'Order',
      });
      throw new BadRequestException({ key: 'order.invalidCheckoutUrl' });
    }

    const isPaymentSuccessful = data.status === 'paid';
    await this.CheckoutService.updateCheckoutStatus(
      checkoutId,
      data.payment_method?.toUpperCase() as PaymentWay,
      isPaymentSuccessful,
      data.fees,
      signature,
    );

    const orderId =
      await this.CheckoutService.findOrderIdByCheckoutId(checkoutId);

    this.logger.log({
      message: 'Webhook processed for order',
      orderId,
      checkoutId,
      status: data.status,
      context: 'Order',
    });

    const buyerId =
      await this.CheckoutService.findBuyerIdByCheckoutId(checkoutId);

    const finalDataForClient: PaymentClientData = {
      orderId: orderId,
      status: data.status,
      amount: data.amount,
      currency: data.currency as CurrencyCode,
      paymentMethod: data.payment_method || null,
    };

    if (isPaymentSuccessful) {
      this.logger.log({
        message: 'Payment successful, order processed',
        checkoutId,
        orderId,
        context: 'Order',
      });
      await this.notificationService.sendNotification(
        'notifications.payment.successful.title',
        'notifications.payment.successful.body',
        buyerId,
        NOTIFICATION_TYPE.ORDERS,
        { checkoutId },
      );

      await this.invoiceQueue.add(INVOICE_JOBS.GENERATE_INVOICE, {
        orderId: orderId,
      });
      this.eventEmitter.emit('order.paid', orderId);
    } else {
      this.logger.warn({
        message: 'Payment failed or canceled',
        checkoutId,
        orderId,
        status: data.status,
        context: 'Order',
      });
      finalDataForClient.errorMessage = this.i18nService.t(
        'order.payment.failedOrCanceled',
      );
      await this.notificationService.sendNotification(
        'notifications.payment.failed.title',
        'notifications.payment.failed.body',
        buyerId,
        NOTIFICATION_TYPE.ORDERS,
        { checkoutId },
      );
    }

    await this.redisService.set<PaymentClientData>(
      `payment:result:${orderId}`,
      finalDataForClient,
      300, // Store for 5 minutes
    );
  }

  async getPaymentRedirectUrl(orderId: string): Promise<string> {
    if (!orderId) {
      this.logger.error(`Redirect attempt without Order ID.`);
      return `amerli://payment/status?status=error&message=${this.i18nService.t(
        'order.redirect.invalidId',
      )}`;
    }

    const redisData = await this.redisService.get<PaymentClientData>(
      `payment:result:${orderId}`,
    );

    if (!redisData) {
      this.logger.error(
        `Payment token for order ${orderId} not found or expired.`,
        orderId,
      );
      return `amerli://payment/status?status=error&message=${this.i18nService.t(
        'order.redirect.syncError',
      )}`;
    }

    const statusPath = redisData.status === 'paid' ? 'success' : 'failure';
    const params = new URLSearchParams();
    params.append(
      'orderId',
      redisData?.orderId ? redisData.orderId.toString() : 'N/A',
    );
    params.append('status', redisData.status);
    params.append('amount', `${redisData.amount} ${redisData.currency}`);
    params.append('paymentMethod', redisData.paymentMethod as string);
    if (redisData.errorMessage) {
      params.append('errorReason', redisData.errorMessage);
    }

    return `amerli://payment/${statusPath}?${params.toString()}`;
  }

  async findProductsByOrder(orderId: number) {
    const order = await this.orderProductRepo.find({
      where: { order: { id: orderId } },
      relations: ['product', 'product.pictures'],
      withDeleted: true,
      select: {
        product: {
          id: true,
          name: true,
          price: true,
          pictures: { url: true, isMain: true },
        },
        quantity: true,
      },
    });
    const productsWithUrls = await Promise.all(
      order.map(async (op) => {
        const mainPicUrl = op?.product?.pictures.find((pic) => pic.isMain)?.url;
        const presignedUrl = mainPicUrl
          ? await this.objectStorageService.getPresignedUrl(
              mainPicUrl,
              BUCKET_TARGETS.PRODUCT_PICTURES,
            )
          : null;

        return {
          id: op?.product.id,
          name: op?.product.name,
          price: op?.product.price,
          quantity: op?.quantity,
          picture: presignedUrl,
        };
      }),
    );
    return productsWithUrls;
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
      .withDeleted()
      .select([
        'p.id AS id',
        'p.name AS name',
        'p.price AS price',
        'op.quantity AS quantity',
        'mainPicture.url AS picture',
      ])
      .getRawMany();

    if (products.length > 0) {
      const productsWithPresignedUrls = await Promise.all(
        products.map(async (p) => ({
          ...p,
          picture: p.picture
            ? await this.objectStorageService.getPresignedUrl(
                p.picture,
                BUCKET_TARGETS.PRODUCT_PICTURES,
              )
            : null,
        })),
      );
      return productsWithPresignedUrls;
    }

    const order = await this.orderRepo.findOneBy({ id: orderId });
    if (!order) {
      throw new NotFoundException({
        key: 'order.notFound',
        args: { id: orderId },
      });
    }
    throw new NotFoundException({
      key: 'order.notFoundForUser',
      args: { id: orderId },
    });
  }

  async countProductsInOrder(orderId: number) {
    return this.orderProductRepo.count({ where: { order: { id: orderId } } });
  }

  //TODO: handle stock release on payment failure or order cancellation
  //handle blacklist users
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
        throw new BadRequestException({ key: 'order.create.addressRequired' });
      }
      const orderRepo = em.getRepository(Order);
      const order = orderRepo.create({
        buyerId,
        totalAmount,
        paymentWay: dto.paymentWay,
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

      this.logger.log({
        message: 'Order created successfully',
        orderId: order.id,
        buyerId: buyerId,
        totalAmount: order.totalAmount,
        paymentWay: order.paymentWay,
        context: 'Order',
      });

      return order;
    });
    const orderResponse: CreateOrderResponseDto = {
      id: order.id,
      totalAmount: order.totalAmount,
      paymentWay: order.paymentWay,
      addressId: order.addressId,
      buyerId: order.buyerId,
    };
    if (dto.paymentWay === 'CASH') {
      await this.trackingService.createInitialTracking(order.id);
      await this.invoiceQueue.add(INVOICE_JOBS.GENERATE_INVOICE, {
        orderId: order.id,
      });
      return { order: orderResponse, checkoutUrl: null };
    }
    const { checkoutId, checkoutUrl } = await this.createChargilyCheckout(
      order.totalAmount,
      order.id,
    );
    await this.CheckoutService.createCheckout(order.id, checkoutId);
    return { order: orderResponse, checkoutUrl };
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
        throw new BadRequestException({
          key: 'order.product.notFound',
          args: { id: item.productId },
        });
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
    try {
      const checkout = await this.chargilyService.createCheckout({
        amount: totalAmount,
        currency: 'dzd',
        //NOTE: Update URLs to actual frontend pages in production
        //TODO: Update URLs to actual frontend pages in production
        success_url: `${backendApiUrl}/order/redirect/${orderId}`,
        webhook_endpoint: `${backendApiUrl}/order/webhook/chargili`,
        failure_url: `${backendApiUrl}/order/redirect/${orderId}`,
      });
      return { checkoutUrl: checkout.checkout_url, checkoutId: checkout.id };
    } catch (error) {
      this.logger.error({
        message: 'Error creating Chargili checkout',
        error,
        context: 'Order',
      });
      throw new ForbiddenException({ key: 'order.checkout.creationFailed' });
    }
  }

  async getOrderById(orderId: number): Promise<Order | null> {
    return this.orderRepo.findOne({ where: { id: orderId } });
  }

  async getAllOrders(
    paginationQuery: PaginationQueryDto,
    userId: number,
    withProducts: boolean,
    status?: OrderStatusQuery,
  ): Promise<PaginationResponseDto<OrderListItemDto>> {
    const { limit, page } = paginationQuery;
    const baseQuery = this.orderRepo
      .createQueryBuilder('orders')
      .where('orders.buyerId = :userId', { userId });
    if (status) {
      if (status === OrderStatusQuery.CANCELED) {
        baseQuery.andWhere('orders.isCancelled = TRUE');
      } else {
        const subQuery = (subQuery) =>
          subQuery

            .select('t1.orderId', 'orderId')

            .addSelect('t1.status', 'latestStatus')

            .from(Tracking, 't1')

            .innerJoin(
              (innerSubquery) =>
                innerSubquery
                  .select('MAX(t2.createdAt)', 'maxCreatedAt')
                  .addSelect('t2.orderId', 'order_id_alias')
                  .from(Tracking, 't2')
                  .groupBy('t2.orderId'),
              't_max',
              't_max.order_id_alias = t1.orderId AND t_max."maxCreatedAt" = t1.createdAt',
            );
        baseQuery.leftJoin(
          subQuery,
          'latest_tracking',
          'latest_tracking."orderId" = orders.id',
        );
        if (status === OrderStatusQuery.DELIVERED) {
          baseQuery.andWhere('latest_tracking."latestStatus" = :status', {
            status: ORDER_STATUS.DELIVERED,
          });
        } else if (status === OrderStatusQuery.IN_PROGRESS) {
          baseQuery.andWhere(
            'latest_tracking."latestStatus" IN (:...statuses)',
            {
              statuses: [
                ORDER_STATUS.CONFIRMATION,
                ORDER_STATUS.PREPARATION,
                ORDER_STATUS.ON_DELIVERING,
              ],
            },
          );
        }
      }
    }
    const total = await baseQuery.getCount();
    const orderIdsQuery = baseQuery
      .select('orders.id', 'id')
      .orderBy('orders.createdAt', 'DESC')
      .take(limit)
      .skip((page - 1) * limit);
    const paginatedIds = await orderIdsQuery.getRawMany();
    if (paginatedIds.length === 0) {
      return {
        data: [],
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
          hasNextPage: page * limit < total,
        },
      };
    }
    const orderIds = paginatedIds.map((o) => o.id);
    const queryBuilder = this.orderRepo
      .createQueryBuilder('orders')
      .where('orders.id IN (:...orderIds)', { orderIds })
      .leftJoin('orders.checkouts', 'checkout')
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
        'orders.paymentWay AS "orderPaymentWay"',
        'checkout.paymentWay AS "checkoutPaymentWay"',
        'latest_tracking."latestStatus" AS status',
        'COUNT(op.id) AS productCount',
      ])
      .groupBy('orders.id')
      .addGroupBy('latest_tracking."latestStatus"')
      .addGroupBy('checkout.paymentWay')
      .withDeleted()
      .orderBy('orders.createdAt', 'DESC');
    const data = await queryBuilder.getRawMany();
    const orders: OrderListItemDto[] = data.map((d) => ({
      id: d.id,
      totalAmount: parseFloat(d.totalamount),
      status: (d?.status as OrderStatus) ?? 'PENDING',
      productCount: parseInt(d.productcount, 10),
      paymentWay:
        d?.orderPaymentWay === ORDER_PAYMENT_METHOD.CASH
          ? ORDER_PAYMENT_METHOD.CASH
          : (d?.checkoutpaymentway ?? 'NOT_PAYD'),
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
          'op.orderId AS "orderId"',
          'p.id AS id',
          'p.name AS name',
          'p.price AS price',
          'op.quantity AS quantity',
          'pic.url AS picture',
          'p.deletedAt AS "deletedAt"',
        ])
        .withDeleted()
        .getRawMany();
      const productsByOrderId = products.reduce(
        (acc, p) => {
          if (!acc[p.orderId]) {
            acc[p.orderId] = [];
          }
          const { orderId, deletedAt, ...productData } = p;
          productData.price = parseFloat(productData.price);
          if (deletedAt) {
            productData.picture = 'deleted_product.jpg';
          }
          acc[orderId].push(productData as ProductOrderItemDto);
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

  /**
   * @method getOrdersForAdmin
   * @description Retrieves a paginated list of all orders for admin view, including client name and latest tracking status.
   * @param {PaginationQueryDto} paginationQuery - Pagination parameters (page, limit).
   * @returns {Promise<PaginationResponseDto<OrderForAdminListItemDto>>} A paginated list of orders with admin-specific details.
   */
  async getOrdersForAdmin(
    paginationQuery: PaginationQueryDto,
    search?: string,
  ): Promise<PaginationResponseDto<OrderForAdminListItemDto>> {
    const { limit, page } = paginationQuery;

    const orderIdsQuery = this.orderRepo
      .createQueryBuilder('order')
      .select('order.id', 'id')
      .leftJoin('order.buyer', 'user')
      .withDeleted()
      .orderBy('order.createdAt', 'DESC')
      .limit(limit)
      .offset((page - 1) * limit);

    if (search) {
      orderIdsQuery.andWhere(
        '(user.name ILIKE :search OR user.phoneNumber ILIKE :search OR CAST(order.id AS TEXT) ILIKE :search)',
        { search: `%${search}%` },
      );
    }
    const total = await this.orderRepo.count();
    const paginatedIds = await orderIdsQuery.getRawMany();

    if (paginatedIds.length === 0) {
      return {
        data: [],
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
          hasNextPage: page * limit < total,
        },
      };
    }

    const orderIds = paginatedIds.map((o) => o.id);

    const queryBuilder = this.orderRepo
      .createQueryBuilder('order')
      .leftJoin('order.buyer', 'user')
      .leftJoin('order.checkouts', 'checkout')
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
        'latest_tracking."orderId" = order.id',
      )
      .where('order.id IN (:...orderIds)', { orderIds })
      .select([
        'order.id AS id',
        'user.name AS clientname',
        'latest_tracking."latestStatus" AS status',
        'order.paymentWay AS "orderPaymentWay"',
        'checkout.paymentWay AS "checkoutPaymentWay"',
      ])
      .withDeleted()
      .orderBy('order.createdAt', 'DESC');

    const data = await queryBuilder.getRawMany();

    const orders: OrderForAdminListItemDto[] = data.map((d) => ({
      id: d?.id,
      clientName: d?.clientname,
      status: (d?.status as OrderStatus) ?? 'PENDING',
      paymentWay:
        d?.orderPaymentWay === ORDER_PAYMENT_METHOD.CASH
          ? ORDER_PAYMENT_METHOD.CASH
          : (d?.checkoutpaymentway ?? 'NOT_PAYD'),
    }));

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

  /**
   * @method getBuyerInfos
   * @description Retrieves buyer information for a specific order.
   * @param {number} orderId - The ID of the order.
   * @returns {Promise<BuyerInfoDto>} The buyer's information.
   */
  async getBuyerInfos(orderId: number): Promise<BuyerInfoDto> {
    const order = await this.orderRepo
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.buyer', 'user')
      .leftJoinAndSelect('order.address', 'address')
      .where('order.id = :orderId', { orderId })
      .select([
        'user.supermarketName',
        'user.name',
        'user.phoneNumber',
        'address.street',
        'address.district',
        'address.city',
      ])
      .withDeleted()
      .getOne();

    if (!order) {
      throw new NotFoundException({
        key: 'order.notFound',
        args: { id: orderId },
      });
    }

    if (!order.buyer) {
      throw new NotFoundException({
        key: 'order.buyerNotFound',
        args: { id: orderId },
      });
    }

    const address = order.address
      ? `${order.address.street}, ${order.address.district}, ${order.address.city}`
      : '';

    return {
      supermarketName: order?.buyer?.supermarketName ?? '',
      clientName: order?.buyer?.name ?? '',
      phoneNumber: order?.buyer?.phoneNumber ?? '',
      address,
    };
  }

  /**
   * @method getPaymentInfo
   * @description Retrieves payment information for a specific order.
   * @param {number} orderId - The ID of the order.
   * @returns {Promise<PaymentInfoDto>} The payment information.
   */
  async getPaymentInfo(orderId: number): Promise<PaymentInfoDto> {
    const order = await this.orderRepo
      .createQueryBuilder('order')
      .leftJoin('order.checkouts', 'checkout')
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
        'latest_tracking."orderId" = order.id',
      )
      .where('order.id = :orderId', { orderId })
      .select([
        'order.paymentWay AS "orderPaymentWay"',
        'checkout.paymentWay AS "checkoutPaymentWay"',
        'order.totalAmount AS totalAmount',
        'order.createdAt AS createdAt',
        'checkout.isPaid AS isPaid',
        'latest_tracking."latestStatus" AS trackingStatus',
      ])
      .withDeleted()
      .getRawOne();

    if (!order) {
      throw new NotFoundException({
        key: 'order.notFound',
        args: { id: orderId },
      });
    }

    const paymentInfo: PaymentInfoDto = {
      paymentWay:
        order.orderPaymentWay === 'CASH'
          ? ('CASH' as string)
          : (order.checkoutPaymentWay ?? 'NOT_PAYED'),
      totalAmount: parseFloat(order?.totalamount),
      createdAt: order?.createdat,
      isPaid: order?.ispaid,
      trackingStatus: order?.trackingstatus ?? 'PENDING',
    };
    return paymentInfo;
  }

  async findOneForInvoice(orderId: number): Promise<Order> {
    const order = await this.orderRepo.findOneOrFail({
      where: { id: orderId },
      withDeleted: true,
      relations: [
        'buyer',
        'address',
        'orderProducts',
        'orderProducts.product',
        'orderProducts.product.brand',
        'checkouts',
      ],
    });
    return order;
  }

  private async getBuyerInfosForOrder(orderId: number): Promise<BuyerInfoDto> {
    const order = await this.orderRepo.findOneOrFail({
      where: { id: orderId },
      relations: ['buyer', 'address'],
      withDeleted: true,
    });

    const address = order.address
      ? `${order.address.street}, ${order.address.district}, ${order.address.city}`
      : '';

    return {
      supermarketName: order?.buyer?.supermarketName ?? '',
      clientName: order?.buyer?.name ?? '',
      phoneNumber: order?.buyer?.phoneNumber ?? '',
      address,
    };
  }

  async orderInfos(orderId: number) {
    const [products, buyerInfo, paymentInfo] = await Promise.all([
      this.findProductsByOrder(orderId),
      this.getBuyerInfosForOrder(orderId),
      this.getPaymentInfo(orderId),
    ]);
    return { products, buyerInfo, paymentInfo };
  }

  /**
   * Cancels an order with proper validation and side effects
   * @param orderId - Order ID to cancel
   * @param userId - User requesting cancellation
   * @param cancelledBy - Who is cancelling (BUYER/SELLER/ADMIN)
   * @param reason - Cancellation reason
   * @returns Success message
   */
  async cancelOrder(
    orderId: number,
    userId: number,
    cancelledBy: 'BUYER' | 'SELLER' | 'ADMIN',
    reason: string,
  ): Promise<{ message: string }> {
    return this.entityManager.transaction(async (manager) => {
      const orderRepo = manager.getRepository(Order);
      const trackingRepo = manager.getRepository(Tracking);
      const productRepo = manager.getRepository(Product);

      const order = await orderRepo.findOne({
        where: { id: orderId },
        relations: ['orderProducts', 'orderProducts.product'],
      });

      if (!order) {
        throw new NotFoundException({
          key: 'order.cancel.notFound',
          args: { id: orderId },
        });
      }

      if (order.isCancelled) {
        throw new BadRequestException({ key: 'order.cancel.alreadyCancelled' });
      }

      this.validateCancellation(order, userId, cancelledBy);

      const currentTracking = await trackingRepo.findOne({
        where: { orderId },
        order: { createdAt: 'DESC' },
      });
      if (currentTracking?.status === ORDER_STATUS.DELIVERED) {
        throw new BadRequestException({
          key: 'order.cancel.deliveredForbidden',
        });
      }

      if (
        currentTracking?.status === ORDER_STATUS.ON_DELIVERING &&
        cancelledBy === 'BUYER'
      ) {
        throw new BadRequestException({
          key: 'order.cancel.onDeliveringForbidden',
        });
      }

      await this.restoreInventory(order.orderProducts, productRepo);

      order.isCancelled = true;
      order.cancellationReason = reason;
      order.cancelledBy = cancelledBy;
      order.cancelledAt = new Date();
      await orderRepo.save(order);

      await trackingRepo.save({
        orderId,
        status: ORDER_STATUS.CANCELLED,
      });
      await this.sendCancellationNotifications(order, cancelledBy, reason);

      let refundId: number | undefined;
      if (this.refundService) {
        const refund = await this.refundService.createRefundForCancelledOrder(
          orderId,
          userId,
          cancelledBy,
          reason,
        );
        if (refund) {
          refundId = refund.id;
        }
      }

      await this.redisService.del(`order:${orderId}`);

      this.logger.log(
        `Order #${orderId} cancelled by ${cancelledBy}. Reason: ${reason}`,
      );

      return {
        message: this.i18nService.t('order.cancel.success'),
        ...(refundId && { refundId, refundStatus: 'PENDING' }),
      };
    });
  }

  /**
   * Validates if user can cancel the order
   */
  private validateCancellation(
    order: Order,
    userId: number,
    cancelledBy: 'BUYER' | 'SELLER' | 'ADMIN',
  ): void {
    if (cancelledBy === 'BUYER' && order.buyerId !== userId) {
      throw new ForbiddenException({ key: 'order.cancel.ownOrdersForbidden' });
    }

    if (cancelledBy === 'SELLER') {
      //NOTE: now we only have one seller for all products VERSION 1
      const isOrderFromThisSeller = order.orderProducts.some(
        (op) => op?.product?.sellerId === userId,
      );
      if (!isOrderFromThisSeller) {
        throw new ForbiddenException({
          key: 'order.cancel.sellerProductsForbidden',
        });
      }
    }
    // Admins can cancel any order (no validation needed)
  }

  /**
   * Restores product inventory after cancellation
   */
  private async restoreInventory(
    orderProducts: OrderProduct[],
    productRepo: Repository<Product>,
  ): Promise<void> {
    for (const op of orderProducts) {
      await productRepo.increment(
        { id: op.productId },
        'quantity',
        op.quantity,
      );
      this.logger.log(
        `Restored ${op.quantity} units to product #${op.productId}`,
      );
    }
  }

  /**
   * Sends cancellation notifications to buyer and seller
   */
  private async sendCancellationNotifications(
    order: Order,
    cancelledBy: string,
    reason: string,
  ): Promise<void> {
    await this.notificationService.sendNotification(
      'notifications.order.cancelled.buyer.title',
      'notifications.order.cancelled.buyer.body',
      order.buyerId,
      NOTIFICATION_TYPE.ORDERS,
      { orderId: order.id, reason },
    );

    const sellerIds = [
      ...new Set(order.orderProducts.map((op) => op.product.sellerId)),
    ];
    await Promise.allSettled(
      sellerIds
        .filter((sellerId) => sellerId !== order.buyerId)
        .map((sellerId) =>
          this.notificationService.sendNotification(
            'notifications.order.cancelled.seller.title',
            'notifications.order.cancelled.seller.body',
            sellerId,
            NOTIFICATION_TYPE.ORDERS,
            { orderId: order.id, cancelledBy },
          ),
        ),
    );
  }
}
