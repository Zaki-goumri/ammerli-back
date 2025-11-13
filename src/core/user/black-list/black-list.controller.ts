import {
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import {
  PaginatedResponse,
  PaginationQueryDto,
  PaginationResponseDto,
} from 'src/common/dtos/pagination.dto';
import { USER_ROLES } from 'src/common/enums/user-role.enum';
import { Roles } from 'src/core/authentication/decorators/role.decorator';
import { AccessTokenGuard } from 'src/core/authentication/guards/access-token.guard';
import { RoleGuard } from 'src/core/authentication/guards/role.guard';
import { MessageDto } from 'src/core/user/dtos/response/message.dto';
import { BlackListService } from './black-list.service';
import { BlackListDto } from './dtos/black-list.dto';
import { GetBlackListedUserDto } from './dtos/get-black-listed-user.dto';

@ApiTags('User-Black-List')
@ApiBearerAuth()
@UseGuards(AccessTokenGuard, RoleGuard)
@Roles(USER_ROLES.ADMIN)
@Controller('user/black-list')
export class BlackListController {
  constructor(private readonly blackListService: BlackListService) {}

  /**
   * @method create
   * @description Adds a user to the blacklist by their ID.
   * @param {number} userId - The ID of the user to blacklist.
   * @returns {Promise<BlackListDto>} The blacklisted user's information.
   */
  @Post(':userId')
  @ApiOperation({ summary: 'Add a user to the blacklist by ID' })
  @ApiCreatedResponse({
    description: 'User added to blacklist successfully',
    type: BlackListDto,
  })
  create(@Param('userId', ParseIntPipe) userId: number): Promise<BlackListDto> {
    return this.blackListService.create(userId);
  }

  /**
   * @method getManyWithPagination
   * @description Retrieves a paginated list of all blacklisted users.
   * @param {PaginationQueryDto} paginationQuery - Pagination and filtering parameters.
   * @returns {Promise<PaginationResponseDto<GetBlackListedUserDto>>} A paginated list of blacklisted users.
   */
  @Get()
  @ApiOperation({ summary: 'Get all blacklisted users' })
  @ApiOkResponse({
    description: 'Successfully fetched blacklisted users',
    type: PaginatedResponse(GetBlackListedUserDto),
  })
  getManyWithPagination(
    @Query() paginationQuery: PaginationQueryDto,
  ): Promise<PaginationResponseDto<GetBlackListedUserDto>> {
    return this.blackListService.getManyWithPagination(paginationQuery);
  }

  /**
   * @method restore
   * @description Restores a user, removing them from the blacklist.
   * @param {number} userId - The ID of the user to restore.
   * @returns {Promise<{ message: string }>} A confirmation message.
   */
  @Post('restore/:userId')
  @ApiOperation({
    summary: 'Restore a user and remove them from the blacklist',
  })
  @ApiOkResponse({
    description: 'User restored and removed from blacklist successfully',
    type: MessageDto,
  })
  restore(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<{ message: string }> {
    return this.blackListService.restore(userId);
  }
}
