import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { TrackingService } from './services/tracking.service';
import { AccessTokenGuard } from '../authentication/guards/access-token.guard';
import { Roles } from '../authentication/decorators/role.decorator';
import { USER_ROLES } from 'src/common/enums/user-role.enum';
import { RoleGuard } from '../authentication/guards/role.guard';
import { USER } from '../authentication/decorators/user.decorartor';

@ApiTags('tracking')
@ApiBearerAuth()
@Controller('tracking')
export class TrackingController {
  constructor(private readonly trackingService: TrackingService) {}

  @ApiOperation({ summary: 'Get tracking history for an order' })
  @UseGuards(AccessTokenGuard)
  @Get(':orderId')
  getTrackingHistory(
    @Param('orderId', ParseIntPipe) orderId: number,
    @USER('id') userId: number,
  ) {
    return this.trackingService.getTrackingHistory(orderId, userId);
  }

  @ApiOperation({ summary: 'Add next tracking status to an order' })
  @UseGuards(AccessTokenGuard, RoleGuard)
  @Roles(USER_ROLES.ADMIN, USER_ROLES.WHOLESELLER)
  @Post(':orderId')
  addNextTrackingStatus(@Param('orderId', ParseIntPipe) orderId: number) {
    return this.trackingService.addNextTrackingStatus(orderId);
  }
}
