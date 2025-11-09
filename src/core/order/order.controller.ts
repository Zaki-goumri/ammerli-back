import { EventEmitter2 } from '@nestjs/event-emitter';
import { RedisService } from 'nestjs-redis-client';
import { RoleGuard } from '../authentication/guards/role.guard';
import { Roles } from '../authentication/decorators/role.decorator';
import { USER_ROLES } from 'src/common/enums/user-role.enum';
import { OrderForAdminListItemDto } from './dtos/order-for-admin-list-item.dto';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { QUEUE_NAME } from 'src/common/constants/queues';
import { INVOICE_JOBS } from 'src/common/constants/jobs';
import { GenerateInvoiceDto } from 'src/infrastructure/queue/invoice/dto/generate-invoice.dto';

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
  HttpStatus,
} from '@nestjs/common';
import { OrderService } from './services/order.service';
import {
  PaginationQueryDto,
  PaginationResponseDto,
} from 'src/common/dtos/pagination.dto';
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
import { NotificationsService } from '../notifications/notifications.service';
import { NOTIFICATION_TYPE } from '../notifications/enums/notification-type.enum';
import { PaymentInfoDto } from './dtos/payment-info.dto';
/**
 *
 * @class OrderController
 * @classdesc The main controller for handling order-related operations.
 * This controller is responsible for creating orders, handling payment webhooks, and retrieving user orders.
 * @ApiTags order
 */

export type PaymentStatus =
  | 'paid'
  | 'failed'
  | 'canceled'
  | 'pending'
  | 'error';
export type CurrencyCode = 'dzd' | 'usd' | 'eur' | string; // Assuming 'dzd' is used, include common ones

/**
 * Interface defining the minimal, essential data required by the Flutter client
 * to display the final payment result page. This data is temporarily stored in Redis.
 */
export interface PaymentClientData {
  /** The internal ID of the order/resource the payment belongs to. */
  orderId: number;

  /** The final status of the payment, used for routing the client to success/failure screen. */
  status: string;

  /** The amount paid (usually an integer representing cents/smallest unit). */
  amount: number;

  /** The currency code (e.g., 'dzd', 'usd'). */
  currency: CurrencyCode;

  /** The method used for payment (e.g., 'edahabia', 'cib', 'visa'). */
  paymentMethod: string | null | undefined;

  /** Optional error message/reason in case of payment failure. */
  errorMessage?: string;
}

@Controller('order')
export class OrderController {
  constructor(
    private readonly orderService: OrderService,
    private readonly checkoutService: CheckoutService,
    private readonly notificationService: NotificationsService,
    private readonly eventEmitter: EventEmitter2,
    private readonly redisService: RedisService,
    @InjectQueue(QUEUE_NAME.INVOICE)
    private readonly invoiceQueue: Queue<GenerateInvoiceDto>,
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
    this.logger.log('Received Chargili webhook');
    const checkoutId = extractCheckoutIdFromUrl(data.checkout_url);
    if (!checkoutId) {
      this.logger.error(
        `Invalid checkout URL received in webhook: ${data.checkout_url}`,
      );
      return res.status(400).send({ error: 'Invalid checkout URL' });
    }
    const isPaymentSuccessful = data.status === 'paid' ? true : false;
    await this.checkoutService.updateCheckoutStatus(
      checkoutId,
      data.payment_method?.toUpperCase() as PaymentWay,
      isPaymentSuccessful,
      data.fees,
      headers.authorization,
    );

    const orderId =
      await this.checkoutService.findOrderIdByCheckoutId(checkoutId);
    console.log('Webhook processed for order ID:', orderId);

    const buyerId =
      await this.checkoutService.findBuyerIdByCheckoutId(checkoutId);

    if (isPaymentSuccessful) {
      this.logger.log(
        `Payment successful for checkout ID: ${checkoutId}. Order processed.`,
      );
      await this.notificationService.sendNotification(
        'Payment Successful',
        `Your payment for order with checkout ID ${checkoutId} has been received successfully.`,
        buyerId,
        NOTIFICATION_TYPE.ORDERS,
      );

      const finalDataForClient: PaymentClientData = {
        orderId: orderId as number,
        status: data.status,
        amount: data.amount,
        currency: data.currency,
        paymentMethod: data.payment_method || null,
      };
      await this.redisService.set<PaymentClientData>(
        `payment:result:${orderId}`,
        finalDataForClient,
        3600,
      );
      // Add job to invoice queue
      await this.invoiceQueue.add(INVOICE_JOBS.GENERATE_INVOICE, {
        orderId: orderId as number,
      });
      this.eventEmitter.emit('order.paid', orderId);
      return res.send({ received: true });
    } else {
      this.logger.warn(
        `Payment failed for checkout ID: ${checkoutId}. Order not processed.`,
      );
      await this.notificationService.sendNotification(
        'Payment Failed',
        `Your payment for order with checkout ID ${checkoutId} has failed. Please try again.`,
        buyerId,
        NOTIFICATION_TYPE.ORDERS,
      );

      const finalDataForClient: PaymentClientData = {
        orderId: orderId as number,
        status: data.status,
        amount: data.amount,
        currency: data.currency,
        paymentMethod: data.payment_method || null,
        errorMessage: 'Payment failed or was canceled.',
      };

      await this.redisService.set<PaymentClientData>(
        `payment:result:${orderId}`,
        finalDataForClient,
        3600,
      );

      return res.send({ received: true });
    }
  }

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
  @UseGuards(AccessTokenGuard)
  @ApiOperation({ summary: 'Get all orders for the authenticated user' })
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

  /**
   * @method getOrdersForAdmin
   * @description Retrieves a paginated list of all orders for admin view.
   * @param {PaginationQueryDto} paginationQuery - Pagination parameters (page, limit).
   * @returns {Promise<PaginatedResponse<OrderForAdminListItemDto>>} A paginated list of orders.
   */
  @ApiBearerAuth()
  @UseGuards(AccessTokenGuard, RoleGuard)
  @Roles(USER_ROLES.ADMIN)
  @ApiOperation({ summary: 'Get all orders for admin view' })
  @ApiOkResponse({
    type: PaginatedResponse(OrderForAdminListItemDto),
    description: 'A paginated list of orders for admin view',
  })
  @Get('/admin/all')
  getOrdersForAdmin(
    @Query() { page, limit }: PaginationQueryDto,
  ): Promise<PaginationResponseDto<OrderForAdminListItemDto>> {
    return this.orderService.getOrdersForAdmin({ page, limit });
  }

  @ApiExcludeEndpoint()
  @Get('redirect/:orderId')
  @HttpCode(HttpStatus.FOUND)
  async handlePaymentRedirectTest(
    @Param('orderId') orderId: string,
    @Res() res: Response,
  ) {
    if (!orderId) {
      this.logger.error(`Redirect attempt without Order ID.`);
      const genericFailureLink =
        'amerli://payment/status?status=error&message=InvalidId';
      return res.redirect(genericFailureLink);
    }
    const redisData = await this.redisService.get<PaymentClientData>(
      `payment:result:${orderId}`,
    );
    const data: PaymentClientData | null = redisData ? redisData : null;
    if (!data) {
      this.logger.error(
        `Payment token for order ${orderId} not found or expired.`,
      );
      const genericFailureLink =
        'amerli://payment/status?status=error&message=SyncError';
      return res.redirect(genericFailureLink);
    }

    const statusPath = data.status === 'paid' ? 'success' : 'failure';

    const params = new URLSearchParams();
    params.append('orderId', data?.orderId ? data.orderId.toString() : 'N/A');
    params.append('status', data.status);
    params.append('amount', `${data.amount} ${data.currency}`);
    params.append('paymentMethod', data.paymentMethod as string);
    if (data.errorMessage) {
      params.append('errorReason', data.errorMessage);
    }

    const deepLinkUrl = `amerli://payment/${statusPath}?${params.toString()}`;

    return res.redirect(deepLinkUrl);
  }

  /**
   * Retrieves payment information for a specific order.
   *
   * @param {number} orderId - The ID of the order.
   * @returns {Promise<PaymentInfoDto>} The payment information.
   */
  @ApiBearerAuth()
  @UseGuards(AccessTokenGuard)
  @ApiOperation({ summary: 'Get payment information for a specific order' })
  @ApiOkResponse({
    type: PaymentInfoDto,
    description: 'The payment information.',
  })
  @Get(':orderId/payment-info')
  getPaymentInfo(
    @Param('orderId', ParseIntPipe) orderId: number,
  ): Promise<PaymentInfoDto> {
    return this.orderService.getPaymentInfo(orderId);
  }
}
