import { Controller, Get, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { AccessTokenGuard } from '../authentication/guards/access-token.guard';
import { RoleGuard } from '../authentication/guards/role.guard';
import { USER_ROLES } from 'src/common/enums/user-role.enum';
import { Roles } from '../authentication/decorators/role.decorator';
import { ApiBearerAuth } from '@nestjs/swagger';

@Controller('analytics')
@ApiBearerAuth()
@UseGuards(AccessTokenGuard, RoleGuard)
@Roles(USER_ROLES.ADMIN)
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
