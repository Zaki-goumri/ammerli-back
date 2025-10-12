import { Module } from '@nestjs/common';
import { ProductService } from './product.service';
import { ProductController } from './product.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { Brand } from './entities/brand.entity';
import { Category } from './entities/category.entity';
import { FavProduct } from './entities/fav-product.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Product, Brand, Category, FavProduct])],
  controllers: [ProductController],
  providers: [ProductService],
})
export class ProductModule {}
