import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../core/user/entities/user.entity';
import { Repository } from 'typeorm';
import { Brand } from '../core/product/entities/brand.entity';
import { Category } from '../core/product/entities/category.entity';
import { Product } from '../core/product/entities/product.entity';
import { ProductPicture } from '../core/product/entities/product-picture.entity';
import { Order } from '../core/order/entities/order.entity';
import { Checkout } from '../core/order/entities/checkout.entity';
import { OrderProduct } from '../core/order/entities/product-order.entity';
import { Tracking } from '../core/order/entities/tracking.entity';
import { Address } from '../core/user/entities/address.entity';
import {
  users,
  addresses,
  brands,
  categories,
  products,
  productPictures,
  orders,
  checkouts,
  productOrders,
  trackings,
} from './seeds-data';

@Injectable()
export class SeedService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Brand)
    private readonly brandRepository: Repository<Brand>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(ProductPicture)
    private readonly productPictureRepository: Repository<ProductPicture>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(Checkout)
    private readonly checkoutRepository: Repository<Checkout>,
    @InjectRepository(OrderProduct)
    private readonly productOrderRepository: Repository<OrderProduct>,
    @InjectRepository(Tracking)
    private readonly trackingRepository: Repository<Tracking>,
    @InjectRepository(Address)
    private readonly addressRepository: Repository<Address>,
  ) {}

  async seedUsers() {
    for (const user of users) {
      await this.userRepository.save(user);
    }
  }

  async seedAddresses() {
    for (const address of addresses) {
      await this.addressRepository.save(address);
    }
  }

  async seedBrands() {
    for (const brand of brands) {
      await this.brandRepository.save(brand);
    }
  }

  async seedCategories() {
    for (const category of categories) {
      await this.categoryRepository.save(category);
    }
  }

  async seedProducts() {
    for (const product of products) {
      await this.productRepository.save(product);
    }
  }

  async seedProductPictures() {
    for (const productPicture of productPictures) {
      await this.productPictureRepository.save(productPicture);
    }
  }

  async seedOrders() {
    for (const order of orders) {
      await this.orderRepository.save(order);
    }
  }

  async seedCheckouts() {
    for (const checkout of checkouts) {
      await this.checkoutRepository.save(checkout);
    }
  }

  async seedProductOrders() {
    for (const productOrder of productOrders) {
      await this.productOrderRepository.save(productOrder);
    }
  }

  async seedTrackings() {
    for (const tracking of trackings) {
      await this.trackingRepository.save(tracking);
    }
  }

  async seedAll() {
    await this.seedUsers();
    await this.seedAddresses();
    await this.seedBrands();
    await this.seedCategories();
    await this.seedProducts();
    await this.seedProductPictures();
    await this.seedOrders();
    await this.seedCheckouts();
    await this.seedProductOrders();
    await this.seedTrackings();
  }
}

