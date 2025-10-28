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
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { SendNotificationDto } from './dto/send-notification.dto';
import { PaginationQueryDto } from 'src/common/dtos/pagination.dto';
import { CreateTokenDto } from './dto/create-token.dto';
import { USER } from '../authentication/decorators/user.decorartor';
import { AccessTokenGuard } from '../authentication/guards/access-token.guard';

@Controller('notifications')
@UseGuards(AccessTokenGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post('send-fcm-notification')
  @HttpCode(HttpStatus.OK)
  sendFcmNotification(
    @Body() sendNotificationDto: SendNotificationDto,
    @USER('id') userId: number,
  ) {
    const { title, body, type } = sendNotificationDto;
    return this.notificationsService.sendNotification(
      title,
      body,
      userId,
      type,
    );
  }

  @Post('register-fcm-token')
  registerToken(@Body() dto: CreateTokenDto, @USER('id') userId: number) {
    return this.notificationsService.registerToken(dto, userId);
  }

  @Get()
  findAll(@Query() paginationQuery: PaginationQueryDto) {
    return this.notificationsService.findAll(paginationQuery);
  }

  @Patch(':id/read')
  update(@Param('id', ParseIntPipe) id: number, @USER('id') userId: number) {
    return this.notificationsService.updateRead(id, userId);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @USER('id') userId: number) {
    return this.notificationsService.remove(id, userId);
  }
}
