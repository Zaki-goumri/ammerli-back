import {
  Body,
  Controller,
  HttpCode,
  Post,
  Res,
  Req,
  Headers,
  Logger,
  Get,
} from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dtos/create-order.dto';
import { Request, Response } from 'express';
import { ApiBody, ApiOperation } from '@nestjs/swagger';

@Controller('order')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}
  logger = new Logger(OrderController.name);

  @ApiOperation({ summary: 'Create a new order with payment processing' })
  @ApiBody({ type: CreateOrderDto, description: 'Order creation payload' })
  @Post()
  async createOrder(
    @Body() dto: CreateOrderDto,
    buyerId: number = 1,
    sellerId: number = 1,
  ) {
    return this.orderService.createOrderProductWithPayement(
      dto,
      buyerId,
      sellerId,
    );
  }

  @Post('webhook/chargili')
  @HttpCode(200)
  async handleChargiliWebhook(
    @Body() body: any,
    @Headers() headers: Record<string, string>,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    this.logger.log('🔔 Chargili Webhook Received');
    this.logger.log('Headers:', headers);
    this.logger.log('Body:', body);

    res.send({ received: true });
  }

  @Get('success')
  @HttpCode(200)
  async handleChargiliSuccess(
    @Body() body: any,
    @Headers() headers: Record<string, string>,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    this.logger.log('🔔 Chargili Webhook Received');
    this.logger.log('Headers:', headers);
    this.logger.log('Body:', body);

    res.send({ received: true });
  }
}
