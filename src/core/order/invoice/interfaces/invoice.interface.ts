
/**
 * Represents a single product line item in the invoice.
 */
export interface InvoiceProduct {
  name: string;
  brand: string;
  quantity: number;
  unitPrice: string; // Formatted currency string
  total: string; // Formatted currency string
}

/**
 * Represents the full data structure required to generate an invoice.
 */
export interface InvoiceData {
  invoiceNumber: string;
  invoiceDate: string; // Formatted date string (e.g., DD/MM/YYYY)
  deliveryDate: string; // Formatted date string

  clientName: string;
  clientAddress: string;
  clientPhone: string;
  paymentMethod: string;

  products: InvoiceProduct[];

  subtotal: string; // Formatted currency string
  deliveryCost: string; // Formatted currency string
  totalAmount: string; // Formatted currency string
  amountPaid: string; // Formatted currency string
  remainingAmount: string; // Formatted currency string
}
