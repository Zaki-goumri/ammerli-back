import { Controller, Get } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('daily-stats')
  async getAnalytics() {
    return this.analyticsService.getAnalytics();
  }

  @Get('turnover')
  async getTurnover() {
    return this.analyticsService.getMontlyTurnover();
  }

  @Get('top-products')
  async getTopProducts() {
    return this.analyticsService.getTopSellingProducts();
  }

  @Get('test/daily-stats')
  async getTestAnalytics() {
    return this.analyticsService.getTestAnalytics();
  }

  @Get('test/turnover')
  async getTestTurnover() {
    return this.analyticsService.getTestMontlyTurnover();
  }

  @Get('test/top-products')
  async getTestTopProducts() {
    return this.analyticsService.getTestTopSellingProducts();
  }
}
