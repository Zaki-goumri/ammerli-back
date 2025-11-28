import {
  Body,
  Controller,
  HttpCode,
  Post,
  Res,
  Headers,
  Logger,
  Get,
  Query,
  UseGuards,
  Param,
  ParseIntPipe,
  HttpStatus,
  UseInterceptors,
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
import { Response } from 'express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiExcludeEndpoint,
  ApiOperation,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiForbiddenResponse,
  ApiTags,
  ApiQuery,
} from '@nestjs/swagger';
import { CheckoutDataDto } from '../chargili/dtos/chargili-webhook.dto';
import { AccessTokenGuard } from '../authentication/guards/access-token.guard';
import { USER } from '../authentication/decorators/user.decorartor';
import { PaymentInfoDto } from './dtos/payment-info.dto';
import { USER_ROLES } from 'src/common/enums/user-role.enum';
import { Roles } from '../authentication/decorators/role.decorator';
import { RoleGuard } from '../authentication/guards/role.guard';
import { OrderForAdminListItemDto } from './dtos/order-for-admin-list-item.dto';
import { PresignedUrlInterceptor } from 'src/common/interceptors/presigned-url.interceptor';
import { ConvertToPresignedUrls } from 'src/common/decorators/convert-to-presigned-urls.decorator';
import { BUCKET_TARGETS } from 'src/common/constants/buckets';
import { BlacklistGuard } from '../authentication/guards/blacklist.guard';
import { CancelOrderDto } from './dtos/cancel-order.dto';
import { OrderStatusQuery } from './enums/order-status-query.enum';

/**
 *
 * @class OrderController
 * @classdesc The main controller for handling order-related operations.
 * This controller is responsible for creating orders, handling payment webhooks, and retrieving user orders.
 * @ApiTags order
 */
@ApiTags('Order')
@Controller('order')
@UseInterceptors(PresignedUrlInterceptor)
export class OrderController {
  constructor(private readonly orderService: OrderService) {}
  logger = new Logger(OrderController.name);

  /**
   * @method createOrder
   * @description Create a new order with payment processing.
   * @param {CreateOrderDto} dto - The data for creating the new order.
   * @param {number} buyerId - The ID of the user creating the order.
   * @returns {Promise<any>} The result of the order creation process.
   */
  @ApiBearerAuth()
  @UseGuards(AccessTokenGuard, BlacklistGuard)
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
    this.logger.log(`Creating order for buyer ID: ${buyerId}`);
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
    @Res() res: Response,
  ) {
    this.logger.log('Received Chargili webhook');
    try {
      await this.orderService.processWebhook(data, headers.authorization);
      return res.send({ received: true });
    } catch (error) {
      this.logger.error('Error processing webhook:', error);
      // Depending on the error type, you might want to send a different status code
      return res.status(400).send({ error: error.message });
    }
  }

  @ApiOkResponse({
    type: [ProductOrderItemDto],
    description: 'A list of products for the order',
  })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all products for a specific order' })
  @UseGuards(AccessTokenGuard)
  @ConvertToPresignedUrls(['picture'], BUCKET_TARGETS.PRODUCT_PICTURES)
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
  @ApiQuery({
    name: 'status',
    required: false,
    enum: OrderStatusQuery,
    description: 'Filter orders by status',
  })
  @ApiOkResponse({
    type: PaginatedResponse(OrderListItemDto),
    description: 'A paginated list of orders',
  })
  @Get('/all')
  @ConvertToPresignedUrls(['products.picture'], BUCKET_TARGETS.PRODUCT_PICTURES)
  getAllOrders(
    @Query() { page, limit }: PaginationQueryDto,
    @Query('status') status: OrderStatusQuery,
    @USER('id') userId: number,
  ) {
    return this.orderService.getAllOrders(
      { page, limit },
      userId,
      true,
      status,
    );
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
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search term to filter orders',
  })
  @Get('/admin/all')
  @ConvertToPresignedUrls(['picture'], BUCKET_TARGETS.PRODUCT_PICTURES)
  getOrdersForAdmin(
    @Query() { page, limit }: PaginationQueryDto,
    @Query('search') search?: string,
  ): Promise<PaginationResponseDto<OrderForAdminListItemDto>> {
    return this.orderService.getOrdersForAdmin({ page, limit }, search);
  }

  @ApiExcludeEndpoint()
  @Get('redirect/:orderId')
  @HttpCode(HttpStatus.FOUND)
  async handlePaymentRedirectTest(
    @Param('orderId') orderId: string,
    @Res() res: Response,
  ) {
    const redirectUrl = await this.orderService.getPaymentRedirectUrl(orderId);
    return res.redirect(redirectUrl);
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

  @ApiBearerAuth()
  @UseGuards(AccessTokenGuard)
  @ApiOperation({ summary: 'Get order information for a specific order' })
  @ApiOkResponse({
    type: PaymentInfoDto,
    description: 'The payment information.',
  })
  @Get(':orderId/infos')
  getOrderInfos(@Param('orderId', ParseIntPipe) orderId: number): Promise<any> {
    return this.orderService.orderInfos(orderId);
  }

  /**
   * Cancel an order
   * @param orderId - Order ID to cancel
   * @param userId - Authenticated user ID
   * @param userRole - User role
   * @param dto - Cancellation details
   */
  @UseGuards(AccessTokenGuard)
  @Post(':id/cancel')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Cancel an order',
    description:
      'Cancels an order if allowed. Buyers can cancel during CONFIRMATION. ' +
      'Sellers can cancel during CONFIRMATION and PREPARATION. ' +
      'Inventory is automatically restored.',
  })
  @ApiOkResponse({
    description: 'Order cancelled successfully',
    schema: {
      example: {
        message: 'Order cancelled successfully',
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Cannot cancel order (invalid status or already cancelled)',
  })
  @ApiForbiddenResponse({
    description: 'You do not have permission to cancel this order',
  })
  async cancelOrder(
    @Param('id', ParseIntPipe) orderId: number,
    @USER('id') userId: number,
    @USER('role') userRole: string,
    @Body() dto: CancelOrderDto,
  ): Promise<{ message: string }> {
    this.logger.log(
      `Request to cancel order ${orderId} by user ${userId} (${userRole})`,
    );
    const cancelledBy =
      userRole === USER_ROLES.ADMIN
        ? 'ADMIN'
        : userRole === USER_ROLES.WHOLESELLER
          ? 'SELLER'
          : 'BUYER';

    return this.orderService.cancelOrder(
      orderId,
      userId,
      cancelledBy,
      dto.reason,
    );
  }
}

