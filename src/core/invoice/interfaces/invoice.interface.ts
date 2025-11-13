import { Order } from 'src/core/order/entities/order.entity';
import { OrderProduct } from 'src/core/order/entities/product-order.entity';
import { PaymentMethodType } from 'src/core/order/enums/payment-method.enum';

export interface InvoiceProduct {
  name: string;
  brand: string;
  quantity: number;
  unitPrice: string;
  total: string;
}

export interface InvoiceData {
  invoiceNumber: string;
  invoiceDate: string;
  deliveryDate: string;
  clientName: string;
  clientAddress: string;
  clientPhone: string;
  paymentMethod: PaymentMethodType;
  products: InvoiceProduct[];
  subtotal: string;
  totalAmount: string;
}

export type OrderForInvoice = Order & {
  orderProducts: (OrderProduct & {
    product: { name: string; brand: { label: string }; price: number };
  })[];
};
