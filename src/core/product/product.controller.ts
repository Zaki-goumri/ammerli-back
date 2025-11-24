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
  UploadedFiles,
  Logger,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
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
  ApiConsumes,
  ApiExtraModels,
} from '@nestjs/swagger';
import { ProductService } from './services/product.service';
import { ToggleFavoriteDto } from './dtos/product/toggle-favorite.dto';
import { FavoriteProductDto } from './dtos/product/favorite-product.dto';
import { WholesellerProductDto } from './dtos/product/wholeseller-product.dto';
import { ProductResDto } from './dtos/product/many-product.dto';
import { UpdateProductDto } from './dtos/product/update.dto';
import { PaginatedResponse } from 'src/common/dtos/pagination.dto';
import { FilterProductDto } from './dtos/product/filter.dto';
import { USER } from '../authentication/decorators/user.decorartor';
import { AccessTokenGuard } from '../authentication/guards/access-token.guard';
import { Roles } from 'src/core/authentication/decorators/role.decorator';
import { USER_ROLES } from 'src/common/enums/user-role.enum';
import { RoleGuard } from '../authentication/guards/role.guard';
import { CreateProductDto } from './dtos/product/create.dto';
import { FilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { UploadingOptions } from 'src/infrastructure/object-storage/types/upload-options.interface';
import { PresignedUrlInterceptor } from 'src/common/interceptors/presigned-url.interceptor';
import { ConvertToPresignedUrls } from 'src/common/decorators/convert-to-presigned-urls.decorator';
import { BUCKET_TARGETS } from 'src/common/constants/buckets';
import { ProductDto } from './dtos/product/product.dto';
import { DeleteProductPicturesDto } from './dtos/product/delete-product-pictures.dto';
import { AdminProductDto } from './dtos/product/admin-product.dto';
/**
 * @class ProductController
 * @classdesc The main controller for handling product-related operations.
 * This controller is protected by authentication and role-based access control.
 * @ApiTags products
 */
@ApiTags('products')
@ApiBearerAuth()
@UseGuards(AccessTokenGuard, RoleGuard)
@UseInterceptors(PresignedUrlInterceptor)
@ApiBadRequestResponse({ description: 'Bad request' })
@ApiUnauthorizedResponse({ description: 'Unauthorized' })
@ApiTooManyRequestsResponse({
  description: 'Too many requests (Rate limiting)',
})
@ApiInternalServerErrorResponse({ description: 'Internal server error' })
@Controller('products')
export class ProductController {
  private readonly logger = new Logger(ProductController.name);

  constructor(private readonly productService: ProductService) {}

  /**
   * @method findAll
   * @description Get all products with pagination, search, and filters.
   * @param {FilterProductDto} query - The query parameters for filtering and pagination.
   * @param {number} userId - The ID of the user making the request.
   * @returns {Promise<PaginatedResponse<Product>>} A paginated list of products.
   */
  @Get('/all')
  @HttpCode(HttpStatus.OK)
  @ConvertToPresignedUrls(['pictures'], BUCKET_TARGETS.PRODUCT_PICTURES)
  @ApiOperation({
    summary: 'Get all products with pagination, search, and filters',
  })
  @ApiOkResponse({
    type: PaginatedResponse(ProductResDto),
    description: 'Returns paginated products',
  })
  @ConvertToPresignedUrls(['pictures'], BUCKET_TARGETS.PRODUCT_PICTURES)
  findAll(@Query() query: FilterProductDto, @USER('id') userId: number) {
    const pagination = { page: query.page || 1, limit: query.limit || 10 };
    return this.productService.findManyWithPagination(
      pagination,
      userId,
      query.search,
      query.categoryIds,
      query.brandIds,
    );
  }

  /**
   * @method findOne
   * @description Get a product by its ID.
   * @param {number} id - The ID of the product to retrieve.
   * @returns {Promise<Product>} The product with the specified ID.
   */
  @Get(':id')
  @ConvertToPresignedUrls(
    ['picture', 'pictures'],
    BUCKET_TARGETS.PRODUCT_PICTURES,
  )
  @ApiOperation({ summary: 'Get product by ID' })
  @ApiOkResponse({
    type: ProductDto,
    description: 'Returns a single product',
  })
  @ApiNotFoundResponse({ description: 'Product not found' })
  findOneProduct(
    @Param('id', ParseIntPipe) id: number,
    @USER('id') userId: number,
  ) {
    return this.productService.findOne(id, userId);
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
          description: 'Product description (Optional).',
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
        quantityPerBatch: {
          format: 'int32',
          description: 'The quantity of the product per batch.',
          example: 20,
        },
        specification: {
          type: 'string',
          description:
            'Optional: Product specifications, submitted as a single comma-separated string (e.g., "Color: Blue, Weight: 2kg").',
          example: 'Material: Plastic, Screen: 6.1 inch',
        },
        expirationDate: {
          type: 'string',
          format: 'date',
          description: 'The product expiration date (YYYY-MM-DD).',
          example: '2026-12-31',
        },
      },
      required: [
        'pictures',
        'name',
        'price',
        'quantity',
        'brandId',
        'categoryId',
        'quantityPerBatch',
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
  @ConvertToPresignedUrls(
    ['picture', 'url', 'pictures'],
    BUCKET_TARGETS.PRODUCT_PICTURES,
  )
  create(
    @Body() createProductDto: CreateProductDto,
    @USER('id') userId: number,
    @UploadedFiles(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }),
          new FileTypeValidator({ fileType: '.(png|jpeg|jpg)' }),
        ],
        fileIsRequired: true,
      }),
    )
    files: Array<Express.Multer.File>,
  ) {
    const uploadOptions = {
      pathPrefix: `products/${userId}/`,
    } as UploadingOptions;
    this.logger.log(
      `User ${userId} creating product: ${createProductDto.name}`,
    );
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
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FilesInterceptor('pictures', 3, {
      storage: memoryStorage(),
      limits: {
        fileSize: 10 * 1024 * 1024, // Per-file size limit (10MB)
      },
    }),
  )
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
          description:
            'Optional: New product image files (max 3). If provided, all existing images will be replaced.',
        },
        name: {
          type: 'string',
          description: 'Product name.',
          example: 'Sample Product',
        },
        description: {
          type: 'string',
          description: 'Product description (Optional).',
          example: 'This is an updated sample product description.',
        },
        price: {
          type: 'number',
          format: 'float',
          description: 'Product price must be higher than 50.',
          example: 120.5,
        },
        quantity: {
          type: 'integer',
          format: 'int32',
          description: 'Available quantity.',
          example: 75,
        },
        brandId: {
          type: 'integer',
          format: 'int32',
          description: 'Brand ID.',
          example: 1,
        },
        categoryId: {
          type: 'integer',
          format: 'int32',
          description: 'Category ID.',
          example: 1,
        },
        quantityPerBatch: {
          type: 'integer',
          format: 'int32',
          description: 'The quantity of the product per batch.',
          example: 25,
        },
        specification: {
          type: 'string',
          description:
            'Optional: Product specifications, submitted as a single comma-separated string.',
          example: 'Material: Metal, Screen: 7 inch',
        },
        expirationDate: {
          type: 'string',
          format: 'date',
          description: 'The product expiration date (YYYY-MM-DD).',
          example: '2027-12-31',
        },
        picturesToDelete: {
          type: 'array',
          items: {
            type: 'integer',
            format: 'int32',
          },
          description:
            'Optional: List of picture IDs to be deleted from the product.',
          example: [1, 2],
        },
      },
    },
  })
  @ConvertToPresignedUrls(
    ['picture', 'pictures'],
    BUCKET_TARGETS.PRODUCT_PICTURES,
  )
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateProductDto: UpdateProductDto,
    @USER('id') userId: number,
    @UploadedFiles() files: Array<Express.Multer.File>,
  ) {
    const uploadOptions = {
      pathPrefix: `products/${userId}/`,
    } as UploadingOptions;
    await this.productService.update(
      id,
      updateProductDto,
      userId,
      files,
      uploadOptions,
    );
    this.logger.log(`User ${userId} updated product ${id}`);
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
    this.logger.log(`User ${userId} deleting product ${id}`);
    return this.productService.remove(id, userId);
  }

  /**
   * @method deleteProductImages
   * @description Delete specific images from a product.
   * @param {number} productId - The ID of the product.
   * @param {DeleteProductPicturesDto} dto - DTO containing picture IDs to delete.
   * @returns {Promise<{ message: string }>} A message indicating the result of the operation.
   */
  @Delete(':productId/pictures')
  @HttpCode(HttpStatus.OK)
  @Roles(USER_ROLES.ADMIN, USER_ROLES.WHOLESELLER)
  @ApiOperation({ summary: 'Delete specific images from a product' })
  @ApiOkResponse({
    description: 'Product pictures soft deleted and queued for file deletion',
  })
  @ApiNotFoundResponse({
    description:
      'No product pictures found with the given IDs for this product',
  })
  @ApiParam({ name: 'productId', type: Number, description: 'Product ID' })
  @ApiBody({
    type: DeleteProductPicturesDto,
    description: 'Picture IDs to delete',
  })
  async deleteProductImages(
    @Param('productId', ParseIntPipe) productId: number,
    @Body() dto: DeleteProductPicturesDto,
  ) {
    this.logger.log(
      `Deleting pictures for product ${productId}: ${dto.pictureIds.join(', ')}`,
    );
    return this.productService.deleteProductImages(productId, dto.pictureIds);
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
  @ConvertToPresignedUrls(
    ['url', 'picture', 'pictures'],
    BUCKET_TARGETS.PRODUCT_PICTURES,
  )
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
      query.brandIds,
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
  @ConvertToPresignedUrls(['pictures'], BUCKET_TARGETS.PRODUCT_PICTURES)
  @ApiOkResponse({
    type: PaginatedResponse(FavoriteProductDto),
    description: 'Returns paginated favorite products',
  })
  @Get('favorite/all')
  getFavoriteProducts(
    @Query() query: FilterProductDto,
    @USER('id') userId: number,
  ) {
    const pagination = { page: query.page || 1, limit: query.limit || 10 };
    return this.productService.getFavoriteProducts(
      userId,
      pagination,
      query.search,
      query.categoryIds,
      query.brandIds,
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

  @Get('admin/all')
  @HttpCode(HttpStatus.OK)
  @ConvertToPresignedUrls(['url', 'picture'], BUCKET_TARGETS.PRODUCT_PICTURES)
  @Roles(USER_ROLES.ADMIN)
  @ApiOperation({
    summary: 'Get all products for admin with pagination and search',
  })
  @ConvertToPresignedUrls(['mainPicture'], BUCKET_TARGETS.PRODUCT_PICTURES)
  @ApiOkResponse({
    type: PaginatedResponse(AdminProductDto),
    description: 'Returns paginated products for admin',
  })
  findManyForAdmin(@Query() query: FilterProductDto) {
    const pagination = { page: query.page || 1, limit: query.limit || 10 };
    return this.productService.findManyForAdmin(
      pagination,
      query.search,
      query.categoryIds,
      query.brandIds,
    );
  }
}
