import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '../order/entities/order.entity';
import { Between } from 'typeorm';
import { User } from '../user/entities/user.entity';
import { USER_ROLES } from 'src/common/enums/user-role.enum';
import { Tracking } from '../order/entities/tracking.entity';
import { ORDER_STATUS } from '../order/enums/delivery.enum';
import { OrderProduct } from '../order/entities/product-order.entity';
import { ObjectService } from 'src/infrastructure/object-storage/object-storage.service';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Tracking)
    private readonly trackingRepo: Repository<Tracking>,
    @InjectRepository(OrderProduct)
    private readonly orderProductRepo: Repository<OrderProduct>,
    private readonly objectStorageService: ObjectService,
  ) {}

  async getAnalytics() {
    const [dayAnalytics, turnover, activeSuperMarkets, deliveredCount] =
      await Promise.all([
        this.getDayAnalytics(),
        this.getTurnover(),
        this.getActiveSuperMarketCount(),
        this.getDeliveredOrdersCount(),
      ]);

    return {
      orders: dayAnalytics,
      revenue: turnover,
      supermarkets: activeSuperMarkets,
      deliveredOrders: deliveredCount,
    };
  }

  //TODO: add dto for response
  private async getDayAnalytics(): Promise<{
    count: number;
    percentageChange: number;
  }> {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const todayOrdersCount = await this.orderRepo.count({
      where: {
        createdAt: Between(startOfDay, endOfDay),
        isCancelled: false,
      },
    });

    const startOfYesterday = new Date(startOfDay);
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);
    const endOfYesterday = new Date(endOfDay);
    endOfYesterday.setDate(endOfYesterday.getDate() - 1);

    const yesterdayOrdersCount = await this.orderRepo.count({
      where: {
        createdAt: Between(startOfYesterday, endOfYesterday),
        isCancelled: false,
      },
    });

    let percentageChange = 0;
    if (yesterdayOrdersCount === 0) {
      percentageChange = todayOrdersCount > 0 ? 100 : 0;
    } else {
      percentageChange =
        ((todayOrdersCount - yesterdayOrdersCount) / yesterdayOrdersCount) *
        100;
    }

    return {
      count: todayOrdersCount,
      percentageChange: Math.round(percentageChange * 100) / 100,
    };
  }

  private async getTurnover(): Promise<{ turnover: number }> {
    const orders = await this.orderRepo.find({
      where: { isCancelled: false },
      select: ['totalAmount'],
    });
    const turnover = orders.reduce(
      (sum, order) => sum + Number(order.totalAmount),
      0,
    );
    return { turnover };
  }

  private async getActiveSuperMarketCount(): Promise<{
    todayActiveSuperMarkets: number;
    percentageChange: number;
  }> {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const startOfYesterday = new Date(startOfDay);
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);
    const endOfYesterday = new Date(endOfDay);
    endOfYesterday.setDate(endOfYesterday.getDate() - 1);

    const todayActiveSuperMarkets = await this.userRepo.count({
      where: { role: USER_ROLES.SUPERMARKET, deletedAt: undefined },
    });

    const yesterdayActiveSuperMarkets = await this.userRepo.count({
      where: {
        role: USER_ROLES.SUPERMARKET,
        deletedAt: undefined,
        createdAt: Between(startOfYesterday, endOfYesterday),
      },
    });

    let percentageChange = 0;
    if (yesterdayActiveSuperMarkets === 0) {
      percentageChange = todayActiveSuperMarkets > 0 ? 100 : 0;
    } else {
      percentageChange =
        ((todayActiveSuperMarkets - yesterdayActiveSuperMarkets) /
          yesterdayActiveSuperMarkets) *
        100;
    }

    return { todayActiveSuperMarkets, percentageChange };
  }

  private async getDeliveredOrdersCount(): Promise<{
    count: number;
    percentageChange: number;
  }> {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const todayOrdersCount = await this.trackingRepo.count({
      where: {
        status: ORDER_STATUS.DELIVERED,
        createdAt: Between(startOfDay, endOfDay),
      },
    });

    const startOfYesterday = new Date(startOfDay);
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);
    const endOfYesterday = new Date(endOfDay);
    endOfYesterday.setDate(endOfYesterday.getDate() - 1);

    const yesterdayOrdersCount = await this.trackingRepo.count({
      where: {
        status: ORDER_STATUS.DELIVERED,
        createdAt: Between(startOfYesterday, endOfYesterday),
      },
    });

    let percentageChange = 0;
    if (yesterdayOrdersCount === 0) {
      percentageChange = todayOrdersCount > 0 ? 100 : 0;
    } else {
      percentageChange =
        ((todayOrdersCount - yesterdayOrdersCount) / yesterdayOrdersCount) *
        100;
    }

    return {
      count: todayOrdersCount,
      percentageChange: Math.round(percentageChange * 100) / 100,
    };
  }

  async getMontlyTurnover(): Promise<any> {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const monthNames = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ] as const;

    const monthlyTurnover = await this.orderRepo
      .createQueryBuilder('order')
      .select('EXTRACT(YEAR FROM "order"."createdAt")', 'year')
      .addSelect('EXTRACT(MONTH FROM "order"."createdAt")', 'month_number')
      .addSelect('SUM("order"."totalAmount")', 'turnover')
      .where('"order"."createdAt" >= :sixMonthsAgo', { sixMonthsAgo })
      .andWhere('"order"."isCancelled" = :isCancelled', { isCancelled: false })
      .groupBy('year')
      .addGroupBy('month_number')
      .orderBy('year', 'ASC')
      .addOrderBy('month_number', 'ASC')
      //TODO: add type for raw result
      .getRawMany<{ year: string; month_number: string; turnover: string }>();

    const formattedMonthlyTurnover = monthlyTurnover.map((data) => {
      return {
        month: monthNames[parseInt(data?.month_number, 10) - 1],
        turnover: parseFloat(data?.turnover) ?? 0,
      };
    });

    return formattedMonthlyTurnover;
  }

  async getTopSellingProducts(take: number = 5): Promise<any> {
    const topProducts = await this.orderProductRepo
      .createQueryBuilder('op')
      .select('op.productId', 'productId')
      .leftJoin('op.order', 'order')
      .leftJoin(
        'product_pictures',
        'pp',
        'pp.productId = op.productId AND pp.isMain = TRUE',
      )
      .addSelect('pp.url', 'product_image')
      .addSelect('SUM(op.quantity)', 'total_quantity')
      .where('order.isCancelled = :isCancelled', { isCancelled: false })
      .groupBy('op.productId')
      .addGroupBy('pp.url')
      .orderBy('total_quantity', 'DESC')
      .limit(take)
      //TODO: add type for raw result
      .getRawMany<{
        productId: number;
        total_quantity: string;
        product_image: string;
      }>();

    const formattedRaws = await Promise.all(
      topProducts.map(async (item) => ({
        productId: item.productId,
        totalQuantity: parseInt(item.total_quantity, 10),
        productImage: item.product_image
          ? await this.objectStorageService.getPresignedUrl(item.product_image)
          : null,
      })),
    );

    return formattedRaws;
  }

  // Test methods
  async getTestAnalytics() {
    return {
      orders: { count: 150, percentageChange: 15 },
      revenue: { turnover: 25000 },
      supermarkets: { todayActiveSuperMarkets: 50, percentageChange: 5 },
      deliveredOrders: { count: 120, percentageChange: 10 },
    };
  }

  async getTestMontlyTurnover() {
    return [
      { month: 'May', turnover: 3500 },
      { month: 'Jun', turnover: 4200 },
      { month: 'Jul', turnover: 5000 },
      { month: 'Aug', turnover: 7500 },
      { month: 'Sep', turnover: 5800 },
      { month: 'Oct', turnover: 6200 },
    ];
  }

  async getTestTopSellingProducts() {
    return [
      {
        productId: 1,
        totalQuantity: 120,
        productImage:
          'https://images.unsplash.com/photo-1503602642458-232111445657?q=80&w=800&auto=format&fit=crop',
      },
      {
        productId: 2,
        totalQuantity: 95,
        productImage:
          'https://images.unsplash.com/photo-1503602642458-232111445657?q=80&w=800&auto=format&fit=crop',
      },
      {
        productId: 3,
        totalQuantity: 80,
        productImage:
          'https://images.unsplash.com/photo-1580910051074-3eb694886505?q=80&w=800&auto=format&fit=crop',
      },
      {
        productId: 4,
        totalQuantity: 75,
        productImage:
          'https://images.unsplash.com/photo-1503602642458-232111445657?q=80&w=800&auto=format&fit=crop',
      },
      {
        productId: 5,
        totalQuantity: 60,
        productImage:
          'https://images.unsplash.com/photo-1503602642458-232111445657?q=80&w=800&auto=format&fit=crop',
      },
    ];
  }
}
