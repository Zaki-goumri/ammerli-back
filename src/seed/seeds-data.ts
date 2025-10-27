import { ORDER_STATUS } from 'src/core/order/enums/delivery.enum';
import { USER_ROLES } from '../common/enums/user-role.enum';

export const users: any[] = [
  {
    phoneNumber: '0551234567',
    name: 'Admin User',
    supermarketName: 'Admin Market',
    role: USER_ROLES.ADMIN,
    isRegistered: true,
  },
  {
    phoneNumber: '0557654321',
    name: 'Wholesaler User',
    supermarketName: 'Wholesaler Market',
    role: USER_ROLES.WHOLESELLER,
    isRegistered: true,
  },
  {
    phoneNumber: '0551122334',
    name: 'Supermarket User',
    supermarketName: 'Supermarket A',
    role: USER_ROLES.SUPERMARKET,
    isRegistered: true,
  },
];

export const addresses: any[] = [
  {
    street: '123 Rue Didouche Mourad',
    city: 'Algiers',
    district: 'Bab El Oued',
    userId: 1,
  },
  {
    street: "456 Avenue de 'Ind\xE9pendance'",
    city: 'Oran',
    district: 'Sidi El Houari',
    userId: 2,
  },
  {
    street: '789 Boulevard de la Libert\xE9',
    city: 'Constantine',
    district: 'El Kantara',
    userId: 3,
  },
];

export const brands: any[] = [
  { label: 'Coca-Cola' },
  { label: 'Pepsi' },
  { label: 'Ifri' },
];

export const categories: any[] = [
  { label: 'Beverages', pictureUrl: 'https://example.com/beverages.jpg' },
  { label: 'Snacks', pictureUrl: 'https://example.com/snacks.jpg' },
  {
    label: 'Dairy',
    pictureUrl: 'https://example.com/dairy.jpg',
  },
];

export const products: any[] = [
  {
    name: 'Coca-Cola 1L',
    description: 'A refreshing carbonated soft drink.',
    price: 1.5,
    quantity: 100,
    isActive: true,
    sellerId: 1,
    brandId: 1,
    categoryId: 1,
  },
  {
    name: 'Lays Chips',
    description: 'Classic salted potato chips.',
    price: 0.75,
    quantity: 200,
    isActive: true,
    sellerId: 2,
    brandId: 2,
    categoryId: 2,
  },
  {
    name: 'Ifri Gazouz 1L',
    description: 'A popular Algerian carbonated soft drink.',
    price: 1.25,
    quantity: 150,
    isActive: true,
    sellerId: 1,
    brandId: 3,
    categoryId: 1,
  },
];

export const productPictures: any[] = [
  {
    url: 'https://example.com/coca-cola.jpg',
    isMain: true,
    status: 'completed',
    productId: 1,
  },
  {
    url: 'https://example.com/lays.jpg',
    isMain: true,
    status: 'completed',
    productId: 2,
  },
  {
    url: 'https://example.com/ifri.jpg',
    isMain: true,
    status: 'completed',
    productId: 3,
  },
];

export const orders: any[] = [
  {
    items: [
      {
        productId: 1,
        quantity: 2,
      },
      {
        productId: 2,
        quantity: 1,
      },
    ],
    payementWay: 'CIB',
    addressId: 1,
  },
  {
    payementWay: 'CASH',
    totalAmount: 1.25,
  },
  {
    items: [
      {
        productId: 1,
        quantity: 2,
      },
      {
        productId: 2,
        quantity: 1,
      },
    ],
    payementWay: 'CIB',
    addressId: 2,
  },
  {
    payementWay: 'CASH',
    totalAmount: 1.25,
  },
];

export const checkouts: any[] = [
  {
    chargiliCheckoutId: 'chk_123',
    isPaid: true,
    paymentWay: 'CIB',
    fees: 0.5,
    paidAt: new Date(),
  },
  {
    chargiliCheckoutId: 'chk_456',
    isPaid: false,
    paymentWay: 'CASH',
    fees: 0.25,
  },
];

export const productOrders: any[] = [{ quantity: 2 }, { quantity: 1 }];

export const trackings: any[] = [
  { status: ORDER_STATUS.DELIVERED, orderId: 1 },
  { status: ORDER_STATUS.CONFIRMATION, orderId: 2 },
];

