import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { SendNotificationDto } from './dto/send-notification.dto';
import { PaginationQueryDto } from 'src/common/dtos/pagination.dto';
import { CreateTokenDto } from './dto/create-token.dto';
import { USER } from '../authentication/decorators/user.decorartor';
import { AccessTokenGuard } from '../authentication/guards/access-token.guard';
import { UpdateReadNotificationsDto } from './dto/update-read-notification.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { SendNotificationResponseDto } from './dto/send-notification-response.dto'; // New import
import { RegisterTokenResponseDto } from './dto/register-token-response.dto'; // New import
import { Notification } from './entities/notification.entity'; // New import
import { UpdateResult, DeleteResult } from 'typeorm'; // New import for update/delete results

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('notifications')
@UseGuards(AccessTokenGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post('send-fcm-notification')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send an FCM notification' })
  @ApiBody({ type: SendNotificationDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Notification job added to queue',
    type: SendNotificationResponseDto, // Added response type
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Bad Request' })
  /**
   * Sends an FCM notification to a specific user.
   * @param sendNotificationDto - The DTO containing notification details.
   * @param userId - The ID of the user sending the notification.
   * @returns A promise that resolves to a response indicating the notification job was added to the queue.
   */
  sendFcmNotification(
    @Body() sendNotificationDto: SendNotificationDto,
    @USER('id') userId: number,
  ): Promise<SendNotificationResponseDto> {
    const { title, body, type } = sendNotificationDto;
    return this.notificationsService.sendNotification(
      title,
      body,
      userId,
      type,
    );
  }

  @Post('register-fcm-token')
  @ApiOperation({ summary: 'Register an FCM token for the current user' })
  @ApiBody({ type: CreateTokenDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Token registered successfully',
    type: RegisterTokenResponseDto, // Added response type
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Bad Request' })
  /**
   * Registers an FCM token for the current user.
   * @param dto - The DTO containing the FCM token and device type.
   * @param userId - The ID of the user registering the token.
   * @returns A promise that resolves to a success message.
   */
  registerToken(@Body() dto: CreateTokenDto, @USER('id') userId: number) {
    return this.notificationsService.registerToken(dto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all notifications for the current user' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Notifications retrieved successfully',
    type: [Notification], // Added response type for array of Notification
  })
  /**
   * Retrieves all notifications for the current user.
   * @param paginationQuery - The pagination query parameters.
   * @returns A promise that resolves to a list of notifications.
   */
  findAll(@Query() paginationQuery: PaginationQueryDto) {
    return this.notificationsService.findAll(paginationQuery);
  }

  /**
   * Marks a list of notifications as read.
   * @param dto - The DTO containing the IDs of notifications to mark as read.
   * @returns A promise that resolves to the update result.
   */
  @Patch('/read')
  @ApiOperation({ summary: 'Mark notifications as read' })
  @ApiBody({ type: UpdateReadNotificationsDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Notifications marked as read successfully',
    type: UpdateResult,
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Bad Request' })
  update(@Body() dto: UpdateReadNotificationsDto) {
    return this.notificationsService.updateRead(dto.ids);
  }

  /**
   * Deletes a notification by its ID.
   * @param id - The ID of the notification to delete.
   * @param userId - The ID of the current user (for authorization).
   * @returns A promise that resolves to the delete result.
   */
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a notification' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Notification deleted successfully',
    type: DeleteResult,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Notification not found',
  })
  remove(@Param('id', ParseIntPipe) id: number, @USER('id') userId: number) {
    return this.notificationsService.remove(id, userId);
  }
}
