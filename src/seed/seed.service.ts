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
import { ORDER_PAYMENT_METHOD } from 'src/core/order/enums/order-payment-method.enum';
import { PAYMENT_WAY } from 'src/core/order/enums/payment-way.enum';
import { faker } from '@faker-js/faker';

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
        'TRUNCATE TABLE "refunds", "invoices", "checkouts", "trackings", "order_products", "orders", "fav_products", "product_pictures", "products", "addresses", "categories", "brands", "notifications", "tokens", "users" RESTART IDENTITY CASCADE',
      );
      console.log('Database cleared successfully!');
    } finally {
      await queryRunner.release();
    }
  }

  async seedUsers() {
    console.log('Seeding users...');
    for (const userData of users) {
      const existingUser = await this.userRepository.findOne({
        where: { phoneNumber: userData.phoneNumber },
      });
      if (existingUser) {
        this.createdUsers.push(existingUser);
        console.log(`User ${userData.phoneNumber} already exists, skipping...`);
        continue;
      }
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
      const existingBrand = await this.brandRepository.findOne({
        where: { label: brandData.label },
      });
      if (existingBrand) {
        this.createdBrands.push(existingBrand);
        console.log(`Brand ${brandData.label} already exists, using it...`);
        continue;
      }
      const brand = this.brandRepository.create(brandData);
      const savedBrand = await this.brandRepository.save(brand);
      this.createdBrands.push(savedBrand);
    }

    // Generate additional random brands
    const additionalBrandsCount = faker.number.int({ min: 5, max: 10 });
    for (let i = 0; i < additionalBrandsCount; i++) {
      const randomBrand = this.brandRepository.create({
        label: faker.company.name(),
      });
      const savedBrand = await this.brandRepository.save(randomBrand);
      this.createdBrands.push(savedBrand);
    }

    console.log(`Total brands available: ${this.createdBrands.length}`);
  }

  async seedCategories() {
    console.log('Seeding categories...');
    for (const categoryData of categories) {
      const existingCategory = await this.categoryRepository.findOne({
        where: { label: categoryData.label },
      });
      if (existingCategory) {
        this.createdCategories.push(existingCategory);
        console.log(
          `Category ${categoryData.label} already exists, using it...`,
        );
        continue;
      }
      const category = this.categoryRepository.create(categoryData);
      const savedCategory = await this.categoryRepository.save(category);
      this.createdCategories.push(savedCategory);
    }

    // Generate additional random categories
    const additionalCategoriesCount = faker.number.int({ min: 5, max: 10 });
    for (let i = 0; i < additionalCategoriesCount; i++) {
      const randomCategory = this.categoryRepository.create({
        label: faker.commerce.department(),
        pictureUrl: faker.image.url(),
      });
      const savedCategory = await this.categoryRepository.save(randomCategory);
      this.createdCategories.push(savedCategory);
    }

    console.log(`Total categories available: ${this.createdCategories.length}`);
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

      const existingProduct = await this.productRepository.findOne({
        where: { name: productData.name, sellerId: wholesaler.id },
      });

      if (existingProduct) {
        this.createdProducts.push(existingProduct);
        console.log(`Product ${productData.name} already exists, skipping...`);
        continue;
      }

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

    // Generate additional random products
    const additionalProductsCount = faker.number.int({ min: 20, max: 50 });
    for (let i = 0; i < additionalProductsCount; i++) {
      const randomBrand = faker.helpers.arrayElement(this.createdBrands);
      const randomCategory = faker.helpers.arrayElement(this.createdCategories);

      const randomProduct = this.productRepository.create({
        name: faker.commerce.productName(),
        description: faker.commerce.productDescription(),
        price: parseFloat(faker.commerce.price({ min: 10, max: 1000, dec: 2 })),
        quantity: faker.number.int({ min: 1, max: 100 }),
        quantityPerBatch: faker.number.int({ min: 1, max: 20 }),
        specification: [
          faker.lorem.sentence(),
          faker.lorem.sentence(),
          faker.lorem.sentence(),
        ],
        expirationDate: faker.date.future({ years: 1 }),
        sellerId: wholesaler.id,
        brandId: randomBrand.id,
        categoryId: randomCategory.id,
      });

      const savedProduct = await this.productRepository.save(randomProduct);

      // Add random pictures
      const picturesCount = faker.number.int({ min: 1, max: 3 });
      for (let j = 0; j < picturesCount; j++) {
        const picture = this.productPictureRepository.create({
          url: faker.image.url(),
          productId: savedProduct.id,
        });
        await this.productPictureRepository.save(picture);
      }

      this.createdProducts.push(savedProduct);
    }

    console.log(`Total products available: ${this.createdProducts.length}`);
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
        paymentWay: orderData.paymentWay,
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
            ? i % 2 === 0
              ? PAYMENT_WAY.CIB
              : PAYMENT_WAY.EDAHABIA
            : undefined,
        fees: i % 2 === 0 ? 2.5 : undefined,
        paidAt: i % 2 === 0 ? new Date() : undefined,
        signature:
          i % 2 === 0
            ? `sig_${Math.random().toString(36).substring(7)}`
            : undefined,
      });
      await this.checkoutRepository.save(checkout);
    }

    // Generate additional random orders
    const additionalOrdersCount = faker.number.int({ min: 10, max: 30 });
    for (let i = 0; i < additionalOrdersCount; i++) {
      const address = faker.helpers.arrayElement(this.createdAddresses);
      const productsToBuy = faker.helpers.arrayElements(this.createdProducts, {
        min: 1,
        max: 5,
      });

      let totalAmount = 0;
      const orderProducts: OrderProduct[] = [];

      for (const product of productsToBuy) {
        const quantity = faker.number.int({ min: 1, max: 10 });
        totalAmount += product.price * quantity;
        const orderProduct = this.productOrderRepository.create({
          productId: product.id,
          quantity,
        });
        orderProducts.push(orderProduct);
      }

      const order = this.orderRepository.create({
        buyerId: supermarket.id,
        addressId: address.id,
        paymentWay: faker.helpers.arrayElement([
          ORDER_PAYMENT_METHOD.EPAYMENT,
          ORDER_PAYMENT_METHOD.CASH,
        ]),
        totalAmount,
      });

      const savedOrder = await this.orderRepository.save(order);

      for (const op of orderProducts) {
        op.orderId = savedOrder.id;
        await this.productOrderRepository.save(op);
      }

      const isPaid = faker.datatype.boolean();
      const tracking = this.trackingRepository.create({
        orderId: savedOrder.id,
        status: faker.helpers.arrayElement([
          ORDER_STATUS.CONFIRMATION,
          ORDER_STATUS.PREPARATION,
          ORDER_STATUS.ON_DELIVERING,
          ORDER_STATUS.DELIVERED,
        ]),
      });
      await this.trackingRepository.save(tracking);

      const checkout = this.checkoutRepository.create({
        orderId: savedOrder.id,
        chargiliCheckoutId: `chk_${faker.string.alphanumeric(10)}`,
        isPaid,
        paymentWay: isPaid
          ? faker.helpers.arrayElement([PAYMENT_WAY.CIB, PAYMENT_WAY.EDAHABIA])
          : undefined,
        fees: isPaid
          ? parseFloat(faker.finance.amount({ min: 1, max: 10, dec: 2 }))
          : undefined,
        paidAt: isPaid ? faker.date.recent() : undefined,
        signature: isPaid ? `sig_${faker.string.alphanumeric(10)}` : undefined,
      });
      await this.checkoutRepository.save(checkout);
    }

    console.log(
      `Total orders created: ${orders.length + additionalOrdersCount}`,
    );
  }

  async seedAll() {
    console.log('Starting database seeding...');
    // await this.clearDatabase();
    await this.seedUsers();
    await this.seedAddresses();
    await this.seedBrands();
    await this.seedCategories();
    await this.seedProducts();
    await this.seedOrders();
    console.log('Database seeding completed successfully!');
  }
}
