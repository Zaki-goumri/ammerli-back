import {
  Body,
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
import { BulkDeleteBlacklistedUsersDto } from './dtos/bulk-delete-blacklisted-users.dto';
import { BulkDeleteResponseDto } from './dtos/bulk-delete-response.dto';

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
    description: 'User removed from blacklist successfully',
    type: MessageDto,
  })
  restore(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<{ message: string }> {
    return this.blackListService.restore(userId);
  }

  /**
   * @method bulkDelete
   * @description Soft-deletes multiple blacklisted users at once.
   * @param {BulkDeleteBlacklistedUsersDto} dto - Array of user IDs to soft-delete.
   * @returns {Promise<BulkDeleteResponseDto>} The count of successfully deleted users.
   */
  @Delete('bulk')
  @ApiOperation({
    summary: 'Soft-delete multiple blacklisted users',
    description: 'Soft-deletes (sets deletedAt) for multiple blacklisted users. Only works on users who are blacklisted and not already deleted.',
  })
  @ApiOkResponse({
    description: 'Blacklisted users soft-deleted successfully',
    type: BulkDeleteResponseDto,
  })
  bulkDelete(
    @Body() dto: BulkDeleteBlacklistedUsersDto,
  ): Promise<BulkDeleteResponseDto> {
    return this.blackListService.bulkDelete(dto.userIds);
  }
}
