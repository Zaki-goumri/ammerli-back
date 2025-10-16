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

@Module({
  imports: [TypeOrmModule.forFeature([Product, Brand, Category, FavProduct])],
  controllers: [ProductController],
  providers: [ProductService, BrandService, CategoryService],
  exports: [ProductService],
})
export class ProductModule {}
