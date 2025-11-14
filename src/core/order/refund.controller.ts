import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiTags,
  ApiOkResponse,
  ApiForbiddenResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import { RefundService } from './services/refund.service';
import { Refund } from './entities/refund.entity';
import { CreateRefundDto } from './dtos/create-refund.dto';
import { UpdateRefundStatusDto } from './dtos/update-refund-status.dto';
import { AccessTokenGuard } from '../authentication/guards/access-token.guard';
import { RoleGuard } from '../authentication/guards/role.guard';
import { USER } from '../authentication/decorators/user.decorartor';
import { Roles } from '../authentication/decorators/role.decorator';
import { USER_ROLES } from 'src/common/enums/user-role.enum';

@ApiTags('Refunds')
@Controller('refunds')
export class RefundController {
  constructor(private readonly refundService: RefundService) {}

  /**
   * Create a refund request
   */
  @UseGuards(AccessTokenGuard)
  @Post()
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create refund request',
    description: 'Customer can request a refund for a paid order',
  })
  @ApiBody({ type: CreateRefundDto })
  @ApiOkResponse({
    description: 'Refund request created successfully',
    type: Refund,
  })
  @ApiBadRequestResponse({
    description: 'Invalid request (order not paid, amount exceeds total, etc.)',
  })
  @ApiForbiddenResponse({
    description: 'You can only request refund for your own orders',
  })
  async createRefund(
    @USER('id') userId: number,
    @Body() dto: CreateRefundDto,
  ): Promise<Refund> {
    return this.refundService.createRefund(userId, dto);
  }

  /**
   * Get my refunds
   */
  @UseGuards(AccessTokenGuard)
  @Get('my-refunds')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get my refund requests',
    description: 'Get all refund requests made by the authenticated user',
  })
  @ApiOkResponse({
    description: 'List of user refunds',
    type: [Refund],
  })
  async getMyRefunds(@USER('id') userId: number): Promise<Refund[]> {
    return this.refundService.getMyRefunds(userId);
  }

  /**
   * Get refund by ID
   */
  @UseGuards(AccessTokenGuard)
  @Get(':id')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get refund details',
    description: 'Get details of a specific refund',
  })
  @ApiOkResponse({
    description: 'Refund details',
    type: Refund,
  })
  @ApiNotFoundResponse({
    description: 'Refund not found',
  })
  @ApiForbiddenResponse({
    description: 'You can only view your own refunds',
  })
  async getRefundById(
    @Param('id', ParseIntPipe) refundId: number,
    @USER('id') userId: number,
    @USER('role') userRole: string,
  ): Promise<Refund> {
    // Admins can view any refund, users can only view their own
    const userIdToCheck = userRole === USER_ROLES.ADMIN ? undefined : userId;
    return this.refundService.getRefundById(refundId, userIdToCheck);
  }

  /**
   * Get pending refunds (Admin only)
   */
  @UseGuards(AccessTokenGuard, RoleGuard)
  @Roles(USER_ROLES.ADMIN)
  @Get('admin/pending')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get pending refunds (Admin only)',
    description: 'Get all refunds awaiting admin action',
  })
  @ApiOkResponse({
    description: 'List of pending refunds',
    type: [Refund],
  })
  async getPendingRefunds(): Promise<Refund[]> {
    return this.refundService.getPendingRefunds();
  }

  /**
   * Update refund status (Admin only)
   */
  @UseGuards(AccessTokenGuard, RoleGuard)
  @Roles(USER_ROLES.ADMIN)
  @Patch(':id/status')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update refund status (Admin only)',
    description:
      'Updates refund status after processing in Chargily dashboard',
  })
  @ApiBody({ type: UpdateRefundStatusDto })
  @ApiOkResponse({
    description: 'Refund status updated successfully',
    type: Refund,
  })
  @ApiBadRequestResponse({
    description: 'Invalid status transition',
  })
  @ApiNotFoundResponse({
    description: 'Refund not found',
  })
  async updateRefundStatus(
    @Param('id', ParseIntPipe) refundId: number,
    @USER('id') adminId: number,
    @Body() dto: UpdateRefundStatusDto,
  ): Promise<Refund> {
    return this.refundService.updateRefundStatus(refundId, adminId, dto);
  }

  /**
   * Get refunds for an order (Admin only)
   */
  @UseGuards(AccessTokenGuard, RoleGuard)
  @Roles(USER_ROLES.ADMIN)
  @Get('order/:orderId')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get order refunds (Admin only)',
    description: 'Get all refunds for a specific order',
  })
  @ApiOkResponse({
    description: 'List of order refunds',
    type: [Refund],
  })
  async getOrderRefunds(
    @Param('orderId', ParseIntPipe) orderId: number,
  ): Promise<Refund[]> {
    return this.refundService.getOrderRefunds(orderId);
  }
}
