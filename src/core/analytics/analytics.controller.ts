import { Controller, Get, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { AccessTokenGuard } from '../authentication/guards/access-token.guard';
import { RoleGuard } from '../authentication/guards/role.guard';
import { USER_ROLES } from 'src/common/enums/user-role.enum';
import { Roles } from '../authentication/decorators/role.decorator';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiForbiddenResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

@ApiTags('Analytics')
@Controller('analytics')
@ApiBearerAuth()
@UseGuards(AccessTokenGuard, RoleGuard)
@Roles(USER_ROLES.ADMIN)
@ApiUnauthorizedResponse({
  description: 'Unauthorized - Invalid or missing token',
})
@ApiForbiddenResponse({ description: 'Forbidden - Admin role required' })
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Roles(USER_ROLES.ADMIN)
  @Get('daily-stats')
  @ApiOperation({
    summary: 'Get daily analytics statistics',
    description:
      'Retrieves daily statistics including orders, revenue, and other key metrics for admin dashboard',
  })
  @ApiOkResponse({
    description: 'Daily analytics statistics retrieved successfully',
    schema: {
      example: {
        totalOrders: 150,
        totalRevenue: 25000,
        newUsers: 12,
        completedOrders: 140,
        cancelledOrders: 10,
      },
    },
  })
  async getAnalytics() {
    return this.analyticsService.getAnalytics();
  }

  @Roles(USER_ROLES.ADMIN)
  @Get('turnover')
  @ApiOperation({
    summary: 'Get monthly turnover',
    description:
      'Retrieves monthly turnover data showing revenue trends over time',
  })
  @ApiOkResponse({
    description: 'Monthly turnover data retrieved successfully',
    schema: {
      example: [
        { month: 'January', turnover: 50000 },
        { month: 'February', turnover: 55000 },
        { month: 'March', turnover: 60000 },
      ],
    },
  })
  async getTurnover() {
    return this.analyticsService.getMontlyTurnover();
  }

  @Roles(USER_ROLES.ADMIN)
  @Get('top-products')
  @ApiOperation({
    summary: 'Get top selling products',
    description:
      'Retrieves a list of the top-selling products based on order quantity',
  })
  @ApiOkResponse({
    description: 'Top selling products retrieved successfully',
    schema: {
      example: [
        {
          productId: 1,
          totalQuantity: 250,
          productImage: 'http://example.com/product1.jpg',
        },
        {
          productId: 2,
          totalQuantity: 180,
          productImage: 'http://example.com/product2.jpg',
        },
      ],
    },
  })
  async getTopProducts() {
    return this.analyticsService.getTopSellingProducts();
  }
}
