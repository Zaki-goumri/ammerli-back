import { BUCKET_TARGETS } from 'src/common/constants/buckets';
import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
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
import { DailyStatsDto } from './dto/daily-stats.dto';
import { DayAnalyticsDto } from './dto/day-analytics.dto';
import { TurnoverDto } from './dto/turnover.dto';
import { ActiveSupermarketsDto } from './dto/active-supermarkets.dto';
import { MonthlyTurnoverItemDto, MonthlyTurnoverRawResult } from './dto/monthly-turnover.dto';
import { TopSellingProductDto, TopSellingProductRawResult } from './dto/top-selling-product.dto';

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

  async getAnalytics(): Promise<DailyStatsDto> {
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

  private async getDayAnalytics(): Promise<DayAnalyticsDto> {
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

  private async getTurnover(): Promise<TurnoverDto> {
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

  private async getActiveSuperMarketCount(): Promise<ActiveSupermarketsDto> {
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

  private async getDeliveredOrdersCount(): Promise<DayAnalyticsDto> {
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

  async getMontlyTurnover(): Promise<MonthlyTurnoverItemDto[]> {
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
      .getRawMany<MonthlyTurnoverRawResult>();

    const formattedMonthlyTurnover = monthlyTurnover.map((data) => {
      return {
        month: monthNames[parseInt(data?.month_number, 10) - 1],
        turnover: parseFloat(data?.turnover) ?? 0,
      };
    });

    return formattedMonthlyTurnover;
  }

  async getTopSellingProducts(take: number = 5): Promise<TopSellingProductDto[]> {
    const dateSixMonthsAgo = new Date();
    dateSixMonthsAgo.setMonth(dateSixMonthsAgo.getMonth() - 6);
    const topProducts = await this.orderProductRepo
      .createQueryBuilder('op')
      .select('op.productId', 'productId')
      .innerJoin('op.order', 'order')
      .innerJoin('op.product', 'product')
      .leftJoin(
        'product_pictures',
        'pp',
        'pp.productId = op.productId AND pp.isMain = TRUE',
      )
      .addSelect('pp.url', 'product_image')
      .addSelect('SUM(op.quantity)', 'total_quantity')
      .where('order.isCancelled = :isCancelled', { isCancelled: false })
      .andWhere('order.deletedAt IS NULL')
      .andWhere('product.deletedAt IS NULL')
      .andWhere('order.createdAt >= :dateSixMonthsAgo', { dateSixMonthsAgo })
      .groupBy('op.productId')
      .addGroupBy('pp.url')
      .orderBy('total_quantity', 'DESC')
      .limit(take)
      .getRawMany<TopSellingProductRawResult>();

    const formattedRaws = await Promise.all(
      topProducts.map(async (item) => ({
        productId: item.productId,
        totalQuantity: parseInt(item.total_quantity, 10),
        productImage: item.product_image
          ? await this.objectStorageService.getPresignedUrl(
              item.product_image,
              BUCKET_TARGETS.PRODUCT_PICTURES,
            )
          : null,
      })),
    );
    return formattedRaws;
  }
}
