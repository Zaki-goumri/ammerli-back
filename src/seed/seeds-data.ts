import { USER_ROLES } from '../common/enums/user-role.enum';
import { ORDER_STATUS } from 'src/core/order/enums/delivery.enum';
import { PAYMENT_WAY } from 'src/core/order/enums/payment-way.enum';
import { ORDER_PAYMENT_METHOD } from 'src/core/order/enums/order-payment-method.enum';

export const users = [
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
  { label: 'Beverages', pictureUrl: 'https://example.com/beverages.jpg' },
  { label: 'Snacks', pictureUrl: 'https://example.com/snacks.jpg' },
  { label: 'Dairy', pictureUrl: 'https://example.com/dairy.jpg' },
];

export const products = [
  {
    name: 'Coca-Cola 1L',
    description: 'A refreshing carbonated soft drink.',
    price: 1.5,
    quantity: 100,
    quantityPerBatch: 10,
    pictures: [
      {
        url: 'https://example.com/coca-cola.jpg',
        isMain: true,
        status: 'completed',
      },
    ],
  },
  {
    name: 'Lays Chips',
    description: 'Classic salted potato chips.',
    price: 0.75,
    quantity: 200,
    quantityPerBatch: 20,
    pictures: [
      {
        url: 'https://example.com/lays.jpg',
        isMain: true,
        status: 'completed',
      },
    ],
  },
  {
    name: 'Ifri Gazouz 1L',
    description: 'A popular Algerian carbonated soft drink.',
    price: 1.25,
    quantity: 150,
    quantityPerBatch: 15,
    pictures: [
      {
        url: 'https://example.com/ifri.jpg',
        isMain: true,
        status: 'completed',
      },
    ],
  },
];

export const orders = [
  {
    paymentWay: PAYMENT_WAY.CIB,
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
