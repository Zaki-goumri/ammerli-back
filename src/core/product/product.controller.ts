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
  UseGuards,
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
  ApiParam,
  ApiBearerAuth,
  ApiUnauthorizedResponse,
  ApiTooManyRequestsResponse,
  ApiInternalServerErrorResponse,
  PartialType,
} from '@nestjs/swagger';
import { ProductService } from './services/product.service';
import { UpdateProductDto } from './dtos/product/update.dto';
import { PaginatedResponse } from 'src/common/dtos/pagination.dto';
import { Product } from './entities/product.entity';
import { FilterProductDto } from './dtos/product/filter.dto';
import { USER } from '../authentication/decorators/user.decorartor';
import { AccessTokenGuard } from '../authentication/guards/access-token.guard';
import { Roles } from 'src/core/authentication/decorators/role.decorator';
import { USER_ROLES } from 'src/common/enums/user-role.enum';
import { FavProductDtoRes } from './dtos/product/fav-product.dto';
import { RoleGuard } from '../authentication/guards/role.guard';
import { BrandService } from './services/brand.service';
import { CategoryService } from './services/category.service';
import { Category } from './entities/category.entity';
import { CreateLabelDto } from './dtos/label.dto';
import { Brand } from './entities/brand.entity';
import { CreateProductDto } from './dtos/product/create.dto';

@ApiTags('products')
@ApiBearerAuth()
@UseGuards(AccessTokenGuard, RoleGuard)
@ApiBadRequestResponse({ description: 'Bad request' })
@ApiUnauthorizedResponse({ description: 'Unauthorized' })
@ApiTooManyRequestsResponse({
  description: 'Too many requests (Rate limiting)',
})
@ApiInternalServerErrorResponse({ description: 'Internal server error' })
@Controller('products')
export class ProductController {
  constructor(
    private readonly productService: ProductService,
    private readonly brandService: BrandService,
    private readonly categoryService: CategoryService,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get all products with pagination, search, and filters',
  })
  @ApiOkResponse({
    type: PaginatedResponse(Product),
    description: 'Returns paginated products',
  })
  findAll(@Query() query: FilterProductDto, @USER('id') userId: number) {
    const pagination = { page: query.page || 1, limit: query.limit || 10 };
    return this.productService.findManyWithPagination(
      pagination,
      userId,
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
  @HttpCode(HttpStatus.CREATED)
  @Roles(USER_ROLES.ADMIN, USER_ROLES.WHOLESELLER)
  @ApiOperation({ summary: 'Create a new product' })
  @ApiCreatedResponse({
    type: Product,
    description: 'Product successfully created',
  })
  @ApiBadRequestResponse({ description: 'Invalid input data' })
  @ApiBody({ type: CreateProductDto })
  create(
    @Body() createProductDto: CreateProductDto,
    @USER('id') userId: number,
  ) {
    return this.productService.create(createProductDto, userId);
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @Roles(USER_ROLES.ADMIN, USER_ROLES.WHOLESELLER)
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
  @Roles(USER_ROLES.ADMIN, USER_ROLES.WHOLESELLER)
  @ApiOperation({ summary: 'Delete a product' })
  @ApiNoContentResponse({ description: 'Product successfully deleted' })
  @ApiNotFoundResponse({ description: 'Product not found' })
  @ApiParam({ name: 'id', type: Number, description: 'Product ID' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.productService.remove(id);
  }

  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Get all wholeseller products with pagination, search, and filters',
  })
  @ApiOkResponse({
    type: PaginatedResponse(Product),
    description: 'Returns paginated wholeseller products',
  })
  @Roles(USER_ROLES.WHOLESELLER)
  @Get('wholeseller/all')
  getWholesellerProducts(
    @Query() query: FilterProductDto,
    @USER('id') userId: number,
  ) {
    const pagination = { page: query.page || 1, limit: query.limit || 10 };
    return this.productService.findWholeSellerProducts(
      pagination,
      userId,
      query.search,
      query.categoryId,
    );
  }

  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get all favorite products with pagination, search, and filters',
  })
  @ApiOkResponse({
    type: PaginatedResponse(FavProductDtoRes),
    description: 'Returns paginated favorite products',
  })
  @Get('favorite/all')
  getFavoriteProducts(
    @Query() query: FilterProductDto,
    @USER('id') userId: number,
    @Query('categoryId') categoryId: number,
    @Query('search') search: string,
  ) {
    const pagination = { page: query.page || 1, limit: query.limit || 10 };
    return this.productService.getFavoriteProducts(
      userId,
      pagination,
      search,
      categoryId,
    );
  }

  @Get('categories')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all categories' })
  @ApiOkResponse({
    description: 'Returns all categories',
    type: [Category],
  })
  getAllCategories() {
    return this.categoryService.getAll();
  }

  @Post('categories')
  @HttpCode(HttpStatus.CREATED)
  @Roles(USER_ROLES.ADMIN)
  @ApiOperation({ summary: 'Create a new category' })
  @ApiCreatedResponse({
    description: 'Category successfully created',
    type: Category,
  })
  @ApiBody({
    type: CreateLabelDto,
  })
  createCategory(@Body('label') label: string) {
    return this.categoryService.create(label);
  }

  @Put('categories/:id')
  @HttpCode(HttpStatus.OK)
  @Roles(USER_ROLES.ADMIN)
  @ApiOperation({ summary: 'Update an existing category' })
  @ApiOkResponse({ description: 'Category successfully updated' })
  @ApiNotFoundResponse({ description: 'Category not found' })
  @ApiParam({ name: 'id', type: Number, description: 'Category ID' })
  @ApiBody({
    type: PartialType(CreateLabelDto),
  })
  updateCategory(
    @Param('id', ParseIntPipe) id: number,
    @Body('label') label: string,
  ) {
    return this.categoryService.update(id, label);
  }

  @Delete('categories/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(USER_ROLES.ADMIN)
  @ApiOperation({ summary: 'Delete a category' })
  @ApiNoContentResponse({ description: 'Category successfully deleted' })
  @ApiNotFoundResponse({ description: 'Category not found' })
  @ApiParam({ name: 'id', type: Number, description: 'Category ID' })
  removeCategory(@Param('id', ParseIntPipe) id: number) {
    return this.categoryService.remove(id);
  }

  @Get('brands')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all brands' })
  @ApiOkResponse({
    description: 'Returns all brands',
    type: [Brand],
  })
  getAllBrands() {
    return this.brandService.getAll();
  }

  @Post('brands')
  @HttpCode(HttpStatus.CREATED)
  @Roles(USER_ROLES.ADMIN)
  @ApiOperation({ summary: 'Create a new brand' })
  @ApiCreatedResponse({
    description: 'Brand successfully created',
    type: Brand,
  })
  @ApiBody({
    type: CreateLabelDto,
  })
  createBrand(@Body('label') label: string) {
    return this.brandService.create(label);
  }

  @Put('brands/:id')
  @HttpCode(HttpStatus.OK)
  @Roles(USER_ROLES.ADMIN)
  @ApiOperation({ summary: 'Update an existing brand' })
  @ApiOkResponse({ description: 'Brand successfully updated' })
  @ApiNotFoundResponse({ description: 'Brand not found' })
  @ApiParam({ name: 'id', type: Number, description: 'Brand ID' })
  @ApiBody({
    type: PartialType(CreateLabelDto),
  })
  updateBrand(
    @Param('id', ParseIntPipe) id: number,
    @Body('label') label: string,
  ) {
    return this.brandService.update(id, label);
  }

  @Delete('brands/:id')
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
