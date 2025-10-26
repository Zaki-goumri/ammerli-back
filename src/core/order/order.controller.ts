/**
 * @fileoverview This file contains the controller for handling order-related requests.
 * It defines routes for creating orders, handling payment webhooks, and retrieving user orders.
 * It uses decorators for routing, parameter validation, and Swagger documentation.
 *
 * @module OrderController
 */

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
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { OrderService } from './services/order.service';
import { PaginationQueryDto } from 'src/common/dtos/pagination.dto';
import { ProductOrderItemDto } from './dtos/product-order-item.dto';
import { OrderListItemDto } from './dtos/order-list-item.dto';
import { PaginatedResponse } from 'src/common/dtos/pagination.dto';
import { CreateOrderResDto } from './dtos/create-order.res.dto';
import { CreateOrderDto } from './dtos/create-order.dto';
import { Request, Response } from 'express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiExcludeEndpoint,
  ApiOperation,
  ApiOkResponse,
} from '@nestjs/swagger';
import { CheckoutService } from './services/checkout.service';
import { PaymentWay } from './enums/payement-way.enum';
import { CheckoutDataDto } from '../chargili/dtos/chargili-webhook.dto';
import { extractCheckoutIdFromUrl } from './utils/extract-checkout-id.utils';
import { AccessTokenGuard } from '../authentication/guards/access-token.guard';
import { USER } from '../authentication/decorators/user.decorartor';

/**
 * @class OrderController
 * @classdesc The main controller for handling order-related operations.
 * This controller is responsible for creating orders, handling payment webhooks, and retrieving user orders.
 * @ApiTags order
 */
@Controller('order')
export class OrderController {
  constructor(
    private readonly orderService: OrderService,
    private readonly checkoutService: CheckoutService,
  ) {}
  logger = new Logger(OrderController.name);

  /**
   * @method createOrder
   * @description Create a new order with payment processing.
   * @param {CreateOrderDto} dto - The data for creating the new order.
   * @param {number} buyerId - The ID of the user creating the order.
   * @returns {Promise<any>} The result of the order creation process.
   */
  @ApiBearerAuth()
  @UseGuards(AccessTokenGuard)
  @ApiOperation({ summary: 'Create a new order with payment processing' })
  @ApiOkResponse({
    type: CreateOrderResDto,
    description: 'Order creation response',
  })
  @ApiBody({ type: CreateOrderDto, description: 'Order creation payload' })
  @Post()
  async createOrder(
    @Body() dto: CreateOrderDto,
    @USER('id') buyerId: number,
  ): Promise<CreateOrderResDto> {
    return this.orderService.createOrderProductWithPayement(dto, buyerId);
  }

  /**
   * @method handleChargiliWebhook
   * @description Handle the webhook from Chargili for payment status updates.
   * @param {CheckoutDataDto} data - The data from the webhook.
   * @param {Record<string, string>} headers - The headers of the request.
   * @param {Request} req - The Express request object.
   * @param {Response} res - The Express response object.
   */
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

  /**
   * @method getAllOrders
   * @description Get all orders for the authenticated user.
   * @param {PaginationQueryDto} query - The pagination query parameters.
   * @param {number} userId - The ID of the authenticated user.
   * @returns {Promise<any>} A paginated list of orders.
   */
  @ApiOkResponse({
    type: [ProductOrderItemDto],
    description: 'A list of products for the order',
  })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all products for a specific order' })
  @UseGuards(AccessTokenGuard)
  @Get('/:orderId/products')
  getOrderProducts(
    @Param('orderId', ParseIntPipe) orderId: number,
    @USER('id') userId: number,
  ) {
    return this.orderService.findProductsByOrderId(orderId, userId);
  }

  @ApiBearerAuth()
  @ApiOkResponse({
    type: PaginatedResponse(OrderListItemDto),
    description: 'A paginated list of orders',
  })
  @Get('/all')
  getAllOrders(
    @Query() { page, limit }: PaginationQueryDto,
    @USER('id') userId: number,
  ) {
    return this.orderService.getAllOrders({ page, limit }, userId, true);
  }
}
