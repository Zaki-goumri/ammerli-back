import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiBody,
  ApiParam,
  ApiBearerAuth,
  PartialType,
} from '@nestjs/swagger';
import { BrandService } from './services/brand.service';
import { BrandResDto } from './dtos/brand/brand.res.dto';
import { CreateBrandDto } from './dtos/brand/brand.dto';
import { AccessTokenGuard } from '../authentication/guards/access-token.guard';
import { Roles } from 'src/core/authentication/decorators/role.decorator';
import { USER_ROLES } from 'src/common/enums/user-role.enum';
import { RoleGuard } from '../authentication/guards/role.guard';

@ApiTags('brands')
@ApiBearerAuth()
@UseGuards(AccessTokenGuard, RoleGuard)
@Controller('brands')
export class BrandController {
  constructor(private readonly brandService: BrandService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all brands' })
  @ApiOkResponse({
    description: 'Returns all brands',
    type: [BrandResDto],
  })
  getAllBrands() {
    return this.brandService.getAll();
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(USER_ROLES.ADMIN)
  @ApiOperation({ summary: 'Create a new brand' })
  @ApiCreatedResponse({
    description: 'Brand successfully created',
    type: BrandResDto,
  })
  @ApiBody({
    type: CreateBrandDto,
  })
  createBrand(@Body('label') label: string) {
    return this.brandService.create(label);
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @Roles(USER_ROLES.ADMIN)
  @ApiOperation({ summary: 'Update an existing brand' })
  @ApiOkResponse({
    description: 'Brand successfully updated',
    type: BrandResDto,
  })
  @ApiNotFoundResponse({ description: 'Brand not found' })
  @ApiParam({ name: 'id', type: Number, description: 'Brand ID' })
  @ApiBody({
    type: PartialType(CreateBrandDto),
  })
  updateBrand(
    @Param('id', ParseIntPipe) id: number,
    @Body('label') label: string,
  ) {
    return this.brandService.update(id, label);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(USER_ROLES.ADMIN)
  @ApiOperation({ summary: 'Delete a brand' })
  @ApiNoContentResponse({ description: 'Brand successfully deleted' })
  @ApiNotFoundResponse({ description: 'Brand not found' })
  @ApiParam({ name: 'id', type: Number, description: 'Brand ID' })
  removeBrand(@Param('id', ParseIntPipe) id: number) {
    return this.brandService.remove(id);
  }
}
