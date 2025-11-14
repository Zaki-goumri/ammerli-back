import { USER_ROLES } from '../common/enums/user-role.enum';
import { ORDER_PAYMENT_METHOD } from 'src/core/order/enums/order-payment-method.enum';

export const users = [
  {
    phoneNumber: '0551234567',
    name: 'Admin User',
    supermarketName: 'Admin Dashboard',
    role: USER_ROLES.ADMIN,
    isRegistered: true,
    countryCode: '+213',
  },
  {
    phoneNumber: '0557654321',
    name: 'Ahmed Benali',
    supermarketName: 'Benali Wholesale Distribution',
    role: USER_ROLES.WHOLESELLER,
    isRegistered: true,
    countryCode: '+213',
  },
  {
    phoneNumber: '0551122334',
    name: 'Fatima Khelifi',
    supermarketName: 'El Baraka Supermarket',
    role: USER_ROLES.SUPERMARKET,
    isRegistered: true,
    countryCode: '+213',
  },
  {
    phoneNumber: '0559876543',
    name: 'Mohamed Amara',
    supermarketName: 'Supermarket El Hayat',
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
  {
    street: '321 Rue Larbi Ben Mhidi',
    city: 'Algiers',
    district: 'Hussein Dey',
  },
];

export const brands = [
  { label: 'Coca-Cola' },
  { label: 'Pepsi' },
  { label: 'Ifri' },
  { label: 'Hamoud Boualem' },
  { label: 'Lay\'s' },
  { label: 'Bimo' },
];

export const categories = [
  { label: 'Beverages', pictureUrl: 'categories/beverages.jpg' },
  { label: 'Snacks', pictureUrl: 'categories/snacks.jpg' },
  { label: 'Dairy', pictureUrl: 'categories/dairy.jpg' },
  { label: 'Bakery', pictureUrl: 'categories/bakery.jpg' },
];

export const products = [
  {
    name: 'Coca-Cola 1L',
    description: 'A refreshing carbonated soft drink. Perfect for meals and gatherings.',
    price: 150.0,
    quantity: 100,
    quantityPerBatch: 10,
    specification: ['Volume: 1L', 'Carbonated', 'Refrigerate after opening', 'Original Taste'],
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
    name: 'Ifri Gazouz 1L',
    description: 'A popular Algerian carbonated soft drink with natural flavors.',
    price: 125.0,
    quantity: 150,
    quantityPerBatch: 15,
    specification: ['Volume: 1L', 'Made in Algeria', 'Natural flavors', 'No artificial colors'],
    expirationDate: new Date('2025-11-30'),
    pictures: [
      {
        url: 'products/ifri-gazouz-1l.jpg',
        isMain: true,
        status: 'completed',
      },
    ],
  },
  {
    name: 'Hamoud Selecto 1.5L',
    description: 'Traditional Algerian lemonade, refreshing and fizzy.',
    price: 135.0,
    quantity: 120,
    quantityPerBatch: 12,
    specification: ['Volume: 1.5L', 'Lemon flavored', 'Vitamin C enriched', 'Halal certified'],
    expirationDate: new Date('2025-10-31'),
    pictures: [
      {
        url: 'products/hamoud-selecto.jpg',
        isMain: true,
        status: 'completed',
      },
    ],
  },
  {
    name: 'Lay\'s Classic Chips 150g',
    description: 'Classic salted potato chips, crispy and delicious.',
    price: 75.0,
    quantity: 200,
    quantityPerBatch: 20,
    specification: ['Weight: 150g', 'Flavor: Classic Salted', 'Crispy texture', '100% vegetable oil'],
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
    name: 'Bimo Chocolate Cookies 200g',
    description: 'Delicious chocolate chip cookies, perfect for tea time.',
    price: 95.0,
    quantity: 180,
    quantityPerBatch: 18,
    specification: ['Weight: 200g', 'Contains real chocolate chips', 'No preservatives', 'Halal'],
    expirationDate: new Date('2025-08-15'),
    pictures: [
      {
        url: 'products/bimo-cookies.jpg',
        isMain: true,
        status: 'completed',
      },
    ],
  },
  {
    name: 'Pepsi Cola 1.5L',
    description: 'Bold and refreshing cola drink for any occasion.',
    price: 145.0,
    quantity: 90,
    quantityPerBatch: 9,
    specification: ['Volume: 1.5L', 'Carbonated', 'Best served cold', 'Zero sugar option available'],
    expirationDate: new Date('2026-01-31'),
    pictures: [
      {
        url: 'products/pepsi-1.5l.jpg',
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
      { productName: 'Lay\'s Classic Chips 150g', quantity: 3 },
    ],
  },
  {
    paymentWay: ORDER_PAYMENT_METHOD.CASH,
    items: [
      { productName: 'Ifri Gazouz 1L', quantity: 5 },
      { productName: 'Bimo Chocolate Cookies 200g', quantity: 2 },
    ],
  },
  {
    paymentWay: ORDER_PAYMENT_METHOD.EPAYMENT,
    items: [
      { productName: 'Hamoud Selecto 1.5L', quantity: 4 },
      { productName: 'Pepsi Cola 1.5L', quantity: 2 },
    ],
  },
  {
    paymentWay: ORDER_PAYMENT_METHOD.CASH,
    items: [
      { productName: 'Coca-Cola 1L', quantity: 10 },
    ],
  },
];
