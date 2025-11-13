import { USER_ROLES } from '../common/enums/user-role.enum';
import { ORDER_PAYMENT_METHOD } from 'src/core/order/enums/order-payment-method.enum';

export const users = [
  {
    phoneNumber: '0551234567',
    name: 'Admin User',
    supermarketName: 'Admin Market',
    role: USER_ROLES.ADMIN,
    isRegistered: true,
    countryCode: '+213',
  },
  {
    phoneNumber: '0557654321',
    name: 'Wholesaler User',
    supermarketName: 'Wholesaler Market',
    role: USER_ROLES.WHOLESELLER,
    isRegistered: true,
    countryCode: '+213',
  },
  {
    phoneNumber: '0551122334',
    name: 'Supermarket User',
    supermarketName: 'Supermarket A',
    role: USER_ROLES.SUPERMARKET,
    isRegistered: true,
    countryCode: '+213',
  },
];

export const addresses = [
  {
    street: '123 Rue Didouche Mourad',
    city: 'Algiers',
    district: 'Bab El Oued',
  },
  {
    street: "456 Avenue de l'Indépendance",
    city: 'Oran',
    district: 'Sidi El Houari',
  },
  {
    street: '789 Boulevard de la Liberté',
    city: 'Constantine',
    district: 'El Kantara',
  },
];

export const brands = [
  { label: 'Coca-Cola' },
  { label: 'Pepsi' },
  { label: 'Ifri' },
];

export const categories = [
  { label: 'Beverages', pictureUrl: 'categories/beverages.jpg' },
  { label: 'Snacks', pictureUrl: 'categories/snacks.jpg' },
  { label: 'Dairy', pictureUrl: 'categories/dairy.jpg' },
];

export const products = [
  {
    name: 'Coca-Cola 1L',
    description: 'A refreshing carbonated soft drink.',
    price: 150.0,
    quantity: 100,
    quantityPerBatch: 10,
    specification: ['Volume: 1L', 'Carbonated', 'Refrigerate after opening'],
    expirationDate: new Date('2025-12-31'),
    pictures: [
      {
        url: 'products/coca-cola-1l.jpg',
        isMain: true,
        status: 'completed',
      },
    ],
  },
  {
    name: 'Lays Chips',
    description: 'Classic salted potato chips.',
    price: 75.0,
    quantity: 200,
    quantityPerBatch: 20,
    specification: ['Weight: 150g', 'Flavor: Classic Salted', 'Crispy texture'],
    expirationDate: new Date('2025-06-30'),
    pictures: [
      {
        url: 'products/lays-chips.jpg',
        isMain: true,
        status: 'completed',
      },
    ],
  },
  {
    name: 'Ifri Gazouz 1L',
    description: 'A popular Algerian carbonated soft drink.',
    price: 125.0,
    quantity: 150,
    quantityPerBatch: 15,
    specification: ['Volume: 1L', 'Made in Algeria', 'Natural flavors'],
    expirationDate: new Date('2025-11-30'),
    pictures: [
      {
        url: 'products/ifri-gazouz-1l.jpg',
        isMain: true,
        status: 'completed',
      },
    ],
  },
];

export const orders = [
  {
    paymentWay: ORDER_PAYMENT_METHOD.EPAYMENT,
    items: [
      { productName: 'Coca-Cola 1L', quantity: 2 },
      { productName: 'Lays Chips', quantity: 1 },
    ],
  },
  {
    paymentWay: ORDER_PAYMENT_METHOD.CASH,
    items: [{ productName: 'Ifri Gazouz 1L', quantity: 3 }],
  },
];
