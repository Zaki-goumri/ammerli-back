import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../core/user/entities/user.entity';
import { DataSource, Repository } from 'typeorm';
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
  orders,
} from './seeds-data';
import { USER_ROLES } from 'src/common/enums/user-role.enum';
import { ORDER_STATUS } from 'src/core/order/enums/delivery.enum';
import { OrderPaymentMethodType } from 'src/core/order/enums/order-payment-method.enum';
import { PaymentWay } from 'src/core/order/enums/payment-way.enum';

@Injectable()
export class SeedService {
  private createdUsers: User[] = [];
  private createdAddresses: Address[] = [];
  private createdBrands: Brand[] = [];
  private createdCategories: Category[] = [];
  private createdProducts: Product[] = [];

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
    private readonly dataSource: DataSource,
  ) {}

  async clearDatabase() {
    console.log('Clearing existing data...');
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();

    try {
      await queryRunner.query(
        'TRUNCATE TABLE "checkouts", "trackings", "order_products", "orders", "product_pictures", "products", "addresses", "categories", "brands", "users" RESTART IDENTITY CASCADE',
      );
      console.log('Database cleared successfully!');
    } finally {
      await queryRunner.release();
    }
  }

  async seedUsers() {
    console.log('Seeding users...');
    for (const userData of users) {
      const user = this.userRepository.create(userData);
      const savedUser = await this.userRepository.save(user);
      this.createdUsers.push(savedUser);
    }
    console.log(`Created ${this.createdUsers.length} users`);
  }

  async seedAddresses() {
    console.log('Seeding addresses...');
    for (let i = 0; i < addresses.length; i++) {
      const addressData = addresses[i];
      const user = this.createdUsers[i % this.createdUsers.length];
      const address = this.addressRepository.create({
        ...addressData,
        userId: user.id,
      });
      const savedAddress = await this.addressRepository.save(address);
      this.createdAddresses.push(savedAddress);
    }
    console.log(`Created ${this.createdAddresses.length} addresses`);
  }

  async seedBrands() {
    console.log('Seeding brands...');
    for (const brandData of brands) {
      const brand = this.brandRepository.create(brandData);
      const savedBrand = await this.brandRepository.save(brand);
      this.createdBrands.push(savedBrand);
    }
    console.log(`Created ${this.createdBrands.length} brands`);
  }

  async seedCategories() {
    console.log('Seeding categories...');
    for (const categoryData of categories) {
      const category = this.categoryRepository.create(categoryData);
      const savedCategory = await this.categoryRepository.save(category);
      this.createdCategories.push(savedCategory);
    }
    console.log(`Created ${this.createdCategories.length} categories`);
  }

  async seedProducts() {
    console.log('Seeding products...');
    const wholesaler = this.createdUsers.find(
      (u) => u.role === USER_ROLES.WHOLESELLER,
    );
    if (!wholesaler) {
      console.error('Wholesaler user not found!');
      return;
    }

    for (let i = 0; i < products.length; i++) {
      const productData = products[i];
      const brand = this.createdBrands[i % this.createdBrands.length];
      const category =
        this.createdCategories[i % this.createdCategories.length];

      const { pictures, ...productFields } = productData;
      const product = this.productRepository.create({
        ...productFields,
        sellerId: wholesaler.id,
        brandId: brand.id,
        categoryId: category.id,
      });

      const savedProduct = await this.productRepository.save(product);

      if (pictures && pictures.length > 0) {
        for (const pictureData of pictures) {
          const picture = this.productPictureRepository.create({
            ...pictureData,
            productId: savedProduct.id,
          });
          await this.productPictureRepository.save(picture);
        }
      }
      this.createdProducts.push(savedProduct);
    }
    console.log(`Created ${this.createdProducts.length} products`);
  }

  async seedOrders() {
    console.log('Seeding orders...');
    const supermarket = this.createdUsers.find(
      (u) => u.role === USER_ROLES.SUPERMARKET,
    );
    if (!supermarket) {
      console.error('Supermarket user not found!');
      return;
    }

    for (let i = 0; i < orders.length; i++) {
      const orderData = orders[i];
      const address = this.createdAddresses[i % this.createdAddresses.length];

      let totalAmount = 0;
      const orderProducts: OrderProduct[] = [];

      for (const item of orderData.items) {
        const product = this.createdProducts.find(
          (p) => p.name === item.productName,
        );
        if (product) {
          totalAmount += product.price * item.quantity;
          const orderProduct = this.productOrderRepository.create({
            productId: product.id,
            quantity: item.quantity,
          });
          orderProducts.push(orderProduct);
        }
      }

      const order = this.orderRepository.create({
        buyerId: supermarket.id,
        addressId: address.id,
        paymentWay: orderData.paymentWay as OrderPaymentMethodType,
        totalAmount,
      });

      const savedOrder = await this.orderRepository.save(order);

      for (const op of orderProducts) {
        op.orderId = savedOrder.id;
        await this.productOrderRepository.save(op);
      }

      const tracking = this.trackingRepository.create({
        orderId: savedOrder.id,
        status:
          i % 2 === 0 ? ORDER_STATUS.DELIVERED : ORDER_STATUS.CONFIRMATION,
      });
      await this.trackingRepository.save(tracking);

      const checkout = this.checkoutRepository.create({
        orderId: savedOrder.id,
        chargiliCheckoutId: `chk_${Math.random().toString(36).substring(7)}`,
        isPaid: i % 2 === 0,
        paymentWay:
          i % 2 === 0
            ? ((i % 3 === 0 ? 'EDAHABIA' : 'CIB') as PaymentWay)
            : undefined,
        fees: i % 2 === 0 ? 0.5 : undefined,
        paidAt: i % 2 === 0 ? new Date() : undefined,
      });
      await this.checkoutRepository.save(checkout);
    }
    console.log(`Created ${orders.length} orders with related data`);
  }

  async seedAll() {
    console.log('Starting database seeding...');
    await this.clearDatabase();
    await this.seedUsers();
    await this.seedAddresses();
    await this.seedBrands();
    await this.seedCategories();
    await this.seedProducts();
    await this.seedOrders();
    console.log('Database seeding completed successfully!');
  }
}
