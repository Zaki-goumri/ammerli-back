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
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
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
  ApiConsumes,
  ApiExtraModels,
} from '@nestjs/swagger';
import { ProductService } from './services/product.service';
import { CategoryResDto } from './dtos/category/category.res.dto';
import { BrandResDto } from './dtos/brand/brand.res.dto';
import { ToggleFavoriteDto } from './dtos/product/toggle-favorite.dto';
import { FavoriteProductDto } from './dtos/product/favorite-product.dto';
import { WholesellerProductDto } from './dtos/product/wholeseller-product.dto';
import { ProductDto } from './dtos/product/product.dto';
import { ProductResDto } from './dtos/product/many-product.dto';
import { UpdateProductDto } from './dtos/product/update.dto';
import { PaginatedResponse } from 'src/common/dtos/pagination.dto';
import { FilterProductDto } from './dtos/product/filter.dto';
import { USER } from '../authentication/decorators/user.decorartor';
import { AccessTokenGuard } from '../authentication/guards/access-token.guard';
import { Roles } from 'src/core/authentication/decorators/role.decorator';
import { USER_ROLES } from 'src/common/enums/user-role.enum';
import { RoleGuard } from '../authentication/guards/role.guard';
import { BrandService } from './services/brand.service';
import { CategoryService } from './services/category.service';
import { CreateProductDto } from './dtos/product/create.dto';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { UploadingOptions } from 'src/infrastructure/object-storage/types/upload-options.interface';
import { CreateCategoryDto } from './dtos/category/create-category.dto';
import { CreateBrandDto } from './dtos/brand/brand.dto';

/**
 * @class ProductController
 * @classdesc The main controller for handling product-related operations.
 * This controller is protected by authentication and role-based access control.
 * @ApiTags products
 */
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
  ) {}

  /**
   * @method findAll
   * @description Get all products with pagination, search, and filters.
   * @param {FilterProductDto} query - The query parameters for filtering and pagination.
   * @param {number} userId - The ID of the user making the request.
   * @returns {Promise<PaginatedResponse<Product>>} A paginated list of products.
   */
  @Get('/all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get all products with pagination, search, and filters',
  })
  @ApiOkResponse({
    type: PaginatedResponse(ProductResDto),
    description: 'Returns paginated products',
  })
  findAll(@Query() query: FilterProductDto, @USER('id') userId: number) {
    console.log('categoryIds', query.categoryIds);
    const pagination = { page: query.page || 1, limit: query.limit || 10 };
    return this.productService.findManyWithPagination(
      pagination,
      userId,
      query.search,
      query.categoryIds,
    );
  }

  /**
   * @method findOne
   * @description Get a product by its ID.
   * @param {number} id - The ID of the product to retrieve.
   * @returns {Promise<Product>} The product with the specified ID.
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get product by ID' })
  @ApiOkResponse({
    type: ProductDto,
    description: 'Returns a single product',
  })
  @ApiNotFoundResponse({ description: 'Product not found' })
  findOneProduct(@Param('id', ParseIntPipe) id: number) {
    return this.productService.findOne(id);
  }

  /**
   * @method create
   * @description Create a new product with picture upload.
   * @param {CreateProductDto} createProductDto - The data for creating the new product.
   * @param {number} userId - The ID of the user creating the product.
   * @param {Array<Express.Multer.File>} files - The product pictures to upload.
   * @returns {Promise<Product>} The newly created product.
   */
  @Post('/create')
  @HttpCode(HttpStatus.CREATED)
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Create a new product with picture upload' })
  @ApiCreatedResponse({
    type: ProductDto,
    description: 'Product successfully created',
  })
  @ApiBadRequestResponse({ description: 'Invalid input data' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        pictures: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
          description: 'Product image files (max 3).',
        },
        name: {
          description: 'Product name.',
          example: 'Sample Product',
        },
        description: {
          description: 'Product description.',
          example: 'This is a sample product description.',
        },
        price: {
          format: 'int32',
          description: 'Product price must be higher than 50.',
          example: 100,
        },
        quantity: {
          format: 'int32',
          description: 'Available quantity.',
          example: 50,
        },
        brandId: {
          format: 'int32',
          description: 'Brand ID.',
          example: 1,
        },
        categoryId: {
          format: 'int32',
          description: 'Category ID.',
          example: 1,
        },
      },
      required: [
        'picture',
        'name',
        'price',
        'quantity',
        'brandId',
        'categoryId',
      ],
    },
  })
  @ApiExtraModels(CreateProductDto)
  @UseInterceptors(
    FilesInterceptor('pictures', 3, {
      storage: memoryStorage(),
      limits: {
        fileSize: 10 * 1024 * 1024, // Per-file size limit (5MB)
      },
    }),
  )
  create(
    @Body() createProductDto: CreateProductDto,
    @USER('id') userId: number,
    @UploadedFiles() files: Array<Express.Multer.File>,
  ) {
    const uploadOptions = {
      pathPrefix: `products/${userId}/`,
    } as UploadingOptions;
    return this.productService.create(
      createProductDto,
      userId,
      files,
      uploadOptions,
    );
  }

  /**
   * @method update
   * @description Update an existing product.
   * @param {number} id - The ID of the product to update.
   * @param {UpdateProductDto} updateProductDto - The data for updating the product.
   * @returns {Promise<{ message: string }>} A message indicating the result of the operation.
   */
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

  /**
   * @method remove
   * @description Delete a product.
   * @param {number} id - The ID of the product to delete.
   * @returns {Promise<void>}
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(USER_ROLES.ADMIN, USER_ROLES.WHOLESELLER)
  @ApiOperation({ summary: 'Delete a product' })
  @ApiNoContentResponse({ description: 'Product successfully deleted' })
  @ApiNotFoundResponse({ description: 'Product not found' })
  @ApiParam({ name: 'id', type: Number, description: 'Product ID' })
  remove(@Param('id', ParseIntPipe) id: number, @USER('id') userId: number) {
    return this.productService.remove(id, userId);
  }

  /**
   * @method getWholesellerProducts
   * @description Get all products for a wholesaler with pagination, search, and filters.
   * @param {FilterProductDto} query - The query parameters for filtering and pagination.
   * @param {number} userId - The ID of the wholesaler.
   * @returns {Promise<PaginatedResponse<Product>>} A paginated list of wholesaler products.
   */
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Get all wholeseller products with pagination, search, and filters',
  })
  @ApiOkResponse({
    type: PaginatedResponse(WholesellerProductDto),
    description: 'Returns paginated wholeseller products',
  })
  @Roles(USER_ROLES.WHOLESELLER, USER_ROLES.ADMIN)
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
      query.categoryIds,
    );
  }

  /**
   * @method getFavoriteProducts
   * @description Get all favorite products for the current user with pagination, search, and filters.
   * @param {FilterProductDto} query - The query parameters for filtering and pagination.
   * @param {number} userId - The ID of the current user.
   * @param {number} categoryIds - The ID of the category to filter by.
   * @param {string} search - The search term to filter by.
   * @returns {Promise<PaginatedResponse<FavProductDtoRes>>} A paginated list of favorite products.
   */
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get all favorite products with pagination, search, and filters',
  })
  @ApiOkResponse({
    type: PaginatedResponse(FavoriteProductDto),
    description: 'Returns paginated favorite products',
  })
  @Get('favorite/all')
  getFavoriteProducts(
    @Query() query: FilterProductDto,
    @USER('id') userId: number,
    @Query('categoryIds') categoryIds?: number[],
    @Query('search') search?: string,
  ) {
    const pagination = { page: query.page || 1, limit: query.limit || 10 };
    return this.productService.getFavoriteProducts(
      userId,
      pagination,
      search,
      categoryIds,
    );
  }

  /**
   * @method toggleFavorite
   * @description Toggle the favorite status of a product for the current user.
   * @param {number} productId - The ID of the product to toggle.
   * @param {number} userId - The ID of the current user.
   * @returns {Promise<{ isLoved: boolean }>} An object indicating the new favorite status.
   */
  @Post(':id/toggle-favorite')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Toggle favorite status for a product' })
  @ApiOkResponse({
    description: 'Favorite status toggled successfully',
    type: ToggleFavoriteDto,
  })
  @ApiNotFoundResponse({ description: 'Product not found' })
  toggleFavorite(
    @Param('id', ParseIntPipe) productId: number,
    @USER('id') userId: number,
  ) {
    return this.productService.toggleFavorite(userId, productId);
  }

  
}
