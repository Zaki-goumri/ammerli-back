import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Token } from './entities/token.entity';
import { Notification } from './entities/notification.entity';
import { FcmService } from './fcm.service';
import { FcmTokenService } from './fcm-token.service';
import { InfrastructureModule } from 'src/infrastructure/infrastructure.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Token, Notification]),
    InfrastructureModule,
  ],
  controllers: [NotificationsController],
  providers: [FcmService, FcmTokenService, NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
