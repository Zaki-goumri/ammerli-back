// product.controller.ts
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
  ApiBody,
} from '@nestjs/swagger';
import { ProductService } from './product.service';
import { ProductWithChargili } from './types/product-with-chargili.type';
import { UpdateProductDto } from './dtos/product/update.dto';
import { PaginatedResponse } from 'src/common/dtos/pagination.dto';
import { Product } from './entities/product.entity';
import { FilterProductDto } from './dtos/product/filter.dto';

@ApiTags('products')
@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Get()
  @ApiOperation({
    summary: 'Get all products with pagination, search, and filters',
  })
  @ApiOkResponse({
    type: PaginatedResponse(Product),
    description: 'Returns paginated products',
  })
  findAll(@Query() query: FilterProductDto) {
    return this.productService.findManyWithPagination(
      {
        page: query.page || 1,
        limit: query.limit || 20,
      },
      query.search,
      query.categoryId,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get product by ID' })
  @ApiOkResponse({
    type: Product,
    description: 'Returns a single product',
  })
  @ApiNotFoundResponse({ description: 'Product not found' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.productService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new product' })
  @ApiCreatedResponse({
    type: Product,
    description: 'Product successfully created',
  })
  @ApiBadRequestResponse({ description: 'Invalid input data' })
  @ApiBody({ type: ProductWithChargili })
  create(@Body() createProductDto: ProductWithChargili) {
    return this.productService.create(createProductDto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a product' })
  @ApiOkResponse({
    description: 'Product successfully updated',
  })
  @ApiNotFoundResponse({ description: 'Product not found' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    await this.productService.update(id, updateProductDto);
    return { message: 'Product successfully updated' };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a product' })
  @ApiNoContentResponse({ description: 'Product successfully deleted' })
  @ApiNotFoundResponse({ description: 'Product not found' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.productService.remove(id);
  }
}
