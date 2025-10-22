import { Module } from '@nestjs/common';
import { ProductService } from './services/product.service';
import { ProductController } from './product.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { Brand } from './entities/brand.entity';
import { Category } from './entities/category.entity';
import { FavProduct } from './entities/fav-product.entity';
import { BrandService } from './services/brand.service';
import { CategoryService } from './services/category.service';
import { ObjectStorageModule } from 'src/infrastructure/object-storage/object-storage.module';
import { QueueModule } from 'src/infrastructure/queue/queue.module';
import { ProductPicture } from './entities/product-picture.entity';
import { ProductPictureService } from './services/product-picture.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ProductPicture,
      Product,
      Brand,
      Category,
      FavProduct,
    ]),
    ObjectStorageModule,
    QueueModule,
  ],
  controllers: [ProductController],
  providers: [
    ProductService,
    BrandService,
    CategoryService,
    ProductPictureService,
  ],
  exports: [ProductService],
})
export class ProductModule {}
