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
  UseInterceptors,
  UploadedFile,
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
  ApiBody,
  ApiParam,
  ApiBearerAuth,
  ApiConsumes,
} from '@nestjs/swagger';
import { CategoryService } from './services/category.service';
import { CategoryResDto } from './dtos/category/category.res.dto';
import { CreateCategoryDto } from './dtos/category/create-category.dto';
import { AccessTokenGuard } from '../authentication/guards/access-token.guard';
import { Roles } from 'src/core/authentication/decorators/role.decorator';
import { USER_ROLES } from 'src/common/enums/user-role.enum';
import { RoleGuard } from '../authentication/guards/role.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { PresignedUrlInterceptor } from 'src/common/interceptors/presigned-url.interceptor';
import { ConvertToPresignedUrls } from 'src/common/decorators/convert-to-presigned-urls.decorator';
import { BUCKET_TARGETS } from 'src/common/constants/buckets';
import { UpdateCategoryDto } from './dtos/category/update-category.dto';
import { SubCategoryResDto } from './dtos/category/sub-category-responose.dto';

@ApiTags('categories')
@ApiBearerAuth()
@UseGuards(AccessTokenGuard, RoleGuard)
@UseInterceptors(PresignedUrlInterceptor)
@Controller('categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Get('main-categories')
  @HttpCode(HttpStatus.OK)
  @ConvertToPresignedUrls(['pictureUrl'], BUCKET_TARGETS.CATEGORY_PICTURES)
  @ApiOperation({ summary: 'Get all categories' })
  @ApiOkResponse({
    description: 'Returns all categories',
    type: [CategoryResDto],
  })
  getAllCategories() {
    return this.categoryService.getAll();
  }

  @Get(':id/children')
  @HttpCode(HttpStatus.OK)
  @ConvertToPresignedUrls(['pictureUrl'], BUCKET_TARGETS.CATEGORY_PICTURES)
  @ApiOperation({ summary: 'Get all children categories' })
  @ApiOkResponse({
    description: 'Returns all children categories',
    type: [CategoryResDto],
  })
  @ConvertToPresignedUrls(['pictureUrl'], BUCKET_TARGETS.CATEGORY_PICTURES)
  getChildrenCategories(@Param('id', ParseIntPipe) id: number) {
    return this.categoryService.getChildrenCaregories(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(USER_ROLES.ADMIN)
  @ApiOperation({ summary: 'Create a new category' })
  @ApiConsumes('multipart/form-data')
  @ConvertToPresignedUrls(['pictureUrl'], BUCKET_TARGETS.CATEGORY_PICTURES)
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        label: {
          type: 'string',
          description: 'Category label',
          example: 'Electronics',
        },
        picture: {
          type: 'string',
          format: 'binary',
          description: 'Category picture file',
        },
        parentCategoryId: {
          type: 'number',
          description: 'Parent category ID (optional)',
          example: 1,
        },
      },
      required: ['label'],
    },
  })
  @ApiCreatedResponse({
    description: 'Category successfully created',
    type: CategoryResDto,
  })
  @UseInterceptors(
    FileInterceptor('picture', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  createCategory(
    @Body() dto: CreateCategoryDto,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }),
          new FileTypeValidator({ fileType: '.(png|jpeg|jpg)' }),
        ],
        fileIsRequired: true,
      }),
    )
    file: Express.Multer.File,
  ) {
    return this.categoryService.create(dto, file);
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        label: {
          type: 'string',
          description: 'Category label',
          example: 'Electronics',
        },
        picture: {
          type: 'string',
          format: 'binary',
          description: 'category picture file',
        },
        newParentCategoryId: {
          type: 'string',
          description:
            'new parent category ID (optional) as number sting or null string to remove parent and empty string to keep current parent',
          example: 1,
        },
      },
      required: ['label', 'newParentCategoryId'],
    },
  })
  @UseInterceptors(
    FileInterceptor('picture', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  @Roles(USER_ROLES.ADMIN)
  @ApiOperation({ summary: 'Update an existing category' })
  @ApiOkResponse({ description: 'Category successfully updated' })
  @ApiNotFoundResponse({ description: 'Category not found' })
  @ApiParam({ name: 'id', type: Number, description: 'Category ID' })
  @ConvertToPresignedUrls(['pictureUrl'], BUCKET_TARGETS.CATEGORY_PICTURES)
  updateCategory(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCategoryDto,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }),
          new FileTypeValidator({ fileType: '.(png|jpeg|jpg)' }),
        ],
        fileIsRequired: false,
      }),
    )
    file?: Express.Multer.File,
  ) {
    return this.categoryService.update(id, dto, file);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(USER_ROLES.ADMIN)
  @ApiOperation({ summary: 'Delete a category' })
  @ApiNoContentResponse({ description: 'Category successfully deleted' })
  @ApiNotFoundResponse({ description: 'Category not found' })
  @ApiParam({ name: 'id', type: Number, description: 'Category ID' })
  @ConvertToPresignedUrls(['pictureUrl'], BUCKET_TARGETS.CATEGORY_PICTURES)
  removeCategory(@Param('id', ParseIntPipe) id: number) {
    return this.categoryService.remove(id);
  }

  @Get('/subcategories/all')
  @HttpCode(HttpStatus.OK)
  @ConvertToPresignedUrls(
    ['pictureUrl', 'parentCategory.pictureUrl'],
    BUCKET_TARGETS.CATEGORY_PICTURES,
  )
  @ApiOperation({ summary: 'Get all subcategories' })
  @ApiOkResponse({
    description: 'Returns all subcategories',
    type: [SubCategoryResDto],
  })
  getAllSubcategories(): Promise<SubCategoryResDto[]> {
    return this.categoryService.getSubCategories();
  }
}
