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
      },
    });

    const startOfYesterday = new Date(startOfDay);
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);
    const endOfYesterday = new Date(endOfDay);
    endOfYesterday.setDate(endOfYesterday.getDate() - 1);

    const yesterdayOrdersCount = await this.orderRepo.count({
      where: {
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

  //TODO: execlude cancelled orders
  private async getTurnover(): Promise<{ turnover: number }> {
    const orders = await this.orderRepo.find({ select: ['totalAmount'] });
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
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
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
      .leftJoin(
        'product_pictures',
        'pp',
        'pp.productId = op.productId AND pp.isMain = TRUE',
      )
      .addSelect('pp.url', 'product_image')
      .addSelect('SUM(op.quantity)', 'total_quantity')
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

    console.log(topProducts);
    const formattedRaws = topProducts.map((item) => ({
      productId: item.productId,
      totalQuantity: parseInt(item.total_quantity, 10),
      productImage: item.product_image,
    }));

    return formattedRaws;
  }
}
