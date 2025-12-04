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
  Logger,
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
  ApiQuery,
} from '@nestjs/swagger';
import { SendNotificationResponseDto } from './dto/send-notification-response.dto'; // New import
import { RegisterTokenResponseDto } from './dto/register-token-response.dto'; // New import
import { Notification } from './entities/notification.entity'; // New import
import { UpdateResult, DeleteResult } from 'typeorm'; // New import for update/delete results
import { Language } from './entities/token.entity';

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('notifications')
@UseGuards(AccessTokenGuard)
export class NotificationsController {
  private readonly logger = new Logger(NotificationsController.name);

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
   * @returns A promise that resolves to a response indicating the notification job was  // Added response type
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Bad Request' })
  /**
   * Registers an FCM token for the current user.
   * @param dto - The DTO containing the FCM token and device type.
   * @param userId - The ID of the user registering the token.
   * @returns A promise that resolves to a success message.
   */
  registerToken(@Body() dto: CreateTokenDto, @USER('id') userId: number) {
    this.logger.log({
      message: 'Registering FCM token',
      userId,
      deviceType: dto.os,
      context: 'Notifications',
    });
    return this.notificationsService.registerToken(dto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all notifications for the current user' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Notifications retrieved successfully',
    type: [Notification],
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'lang', required: false, enum: Language })
  /**
   * Retrieves all notifications for the current user.
   * @param paginationQuery - The pagination query parameters.
   * @returns A promise that resolves to a list of notifications.
   */
  findAll(
    @Query() paginationQuery: PaginationQueryDto,
    @USER('id') userId: number,
    @Query('lang') lang: Language,
  ) {
    return this.notificationsService.findAll(paginationQuery, userId, lang);
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
    this.logger.log({
      message: 'Deleting notification',
      notificationId: id,
      userId,
      context: 'Notifications',
    });
    return this.notificationsService.remove(id, userId);
  }

  @Patch('/language')
  @ApiOperation({ summary: 'Update notification language preference' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Bad Request' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        fcmToken: { type: 'string', example: 'example_fcm_token' },
        language: { type: 'string', example: 'en' },
      },
      required: ['language', 'fcmToken'],
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Notification language updated successfully',
  })
  /**
   * Updates the notification language preference for the current user.
   * @param language - The new language preference.
   * @param userId - The ID of the current user.
   * @returns A promise that resolves when the update is complete.
   */
  updateLanguage(
    @Body('language') lang: Language,
    @Body('fcmToken') fcmToken: string,
    @USER('id') userId: number,
  ) {
    this.logger.log({
      message: 'Updating notification language preference',
      userId,
    });
    return this.notificationsService.updateLanguage(userId, fcmToken, lang);
  }
}
