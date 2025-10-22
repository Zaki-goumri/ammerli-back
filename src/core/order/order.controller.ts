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
  Query,
  UseGuards,
} from '@nestjs/common';
import { OrderService } from './services/order.service';
import { CreateOrderDto } from './dtos/create-order.dto';
import { Request, Response } from 'express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiExcludeEndpoint,
  ApiOperation,
} from '@nestjs/swagger';
import { CheckoutService } from './services/checkout.service';
import { PaymentWay } from './enums/payement-way.enum';
import { CheckoutDataDto } from '../chargili/dtos/chargili-webhook.dto';
import { extractCheckoutIdFromUrl } from './utils/extract-checkout-id.utils';
import { AccessTokenGuard } from '../authentication/guards/access-token.guard';
import { PaginationQueryDto } from 'src/common/dtos/pagination.dto';
import { USER } from '../authentication/decorators/user.decorartor';

@Controller('order')
export class OrderController {
  constructor(
    private readonly orderService: OrderService,
    private readonly checkoutService: CheckoutService,
  ) {}
  logger = new Logger(OrderController.name);
  @ApiBearerAuth()
  @UseGuards(AccessTokenGuard)
  @ApiOperation({ summary: 'Create a new order with payment processing' })
  @ApiBody({ type: CreateOrderDto, description: 'Order creation payload' })
  @Post()
  async createOrder(@Body() dto: CreateOrderDto, @USER('id') buyerId: number) {
    return this.orderService.createOrderProductWithPayement(dto, buyerId);
  }

  @ApiExcludeEndpoint()
  @Post('webhook/chargili')
  @HttpCode(200)
  async handleChargiliWebhook(
    @Body('data') data: CheckoutDataDto,
    @Headers() headers: Record<string, string>,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const checkoutId = extractCheckoutIdFromUrl(data.checkout_url);
    if (checkoutId && data.status === 'paid') {
      await this.checkoutService.updateCheckoutStatus(
        checkoutId,
        data.payment_method?.toUpperCase() as PaymentWay,
        data.fees,
        headers.authorization,
      );
    }
    res.send({ received: true });
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all orders for the authenticated user' })
  @UseGuards(AccessTokenGuard)
  @Get('/all')
  getAllOrders(
    @Query() { page, limit }: PaginationQueryDto,
    @USER('id') userId: number,
  ) {
    return this.orderService.getAllOrders({ page, limit }, userId);
  }
}
