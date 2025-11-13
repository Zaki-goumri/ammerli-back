import { Injectable, BadRequestException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import {
  Balance,
  Checkout,
  Customer,
  PaymentLink,
  Price,
  Product,
  ProductPrice,
} from './interfaces/data';
import {
  CreateCheckoutParams,
  CreateCustomerParams,
  CreatePaymentLinkParams,
  CreatePriceParams,
  CreateProductParams,
  UpdateCustomerParams,
  UpdatePaymentLinkParams,
  UpdatePriceParams,
  UpdateProductParams,
} from './interfaces/requests';
import { DeleteItemResponse, ListResponse } from './interfaces/responses';

const DEFAULT_PER_PAGE = 10;
const DEFAULT_PAGE = 1;

/**
 * A client for interacting with Chargily's API, supporting operations for customers, products, prices, checkouts, and payment links.
 */
@Injectable()
export class ChargiliService {
  constructor(private readonly httpService: HttpService) {}

  /**
   * Retrieves the current balance information from the Chargily API.
   * @returns {Promise<Balance>} - A promise that resolves to the balance information.
   */
  public async getBalance(): Promise<Balance> {
    const response = await lastValueFrom(
      this.httpService.get<Balance>('/balance'),
    );
    return response.data;
  }

  /**
   * Creates a new customer with specified details.
   * @param {CreateCustomerParams} customer_data - The data for creating a new customer.
   * @returns {Promise<Customer>} - A promise that resolves to the newly created customer.
   */
  public async createCustomer(
    customer_data: CreateCustomerParams,
  ): Promise<Customer> {
    const response = await lastValueFrom(
      this.httpService.post<Customer>('/customers', customer_data),
    );
    return response.data;
  }

  /**
   * Fetches a customer by their unique identifier.
   * @param {string} customer_id - The ID of the customer to retrieve.
   * @returns {Promise<Customer>} - A promise that resolves to the customer details.
   */
  public async getCustomer(customer_id: string): Promise<Customer> {
    const response = await lastValueFrom(
      this.httpService.get<Customer>(`/customers/${customer_id}`),
    );
    return response.data;
  }

  /**
   * Updates an existing customer's details.
   * @param {string} customer_id - The ID of the customer to update.
   * @param {UpdateCustomerParams} update_data - New data for updating the customer.
   * @returns {Promise<Customer>} - A promise that resolves to the updated customer details.
   */
  public async updateCustomer(
    customer_id: string,
    update_data: UpdateCustomerParams,
  ): Promise<Customer> {
    const response = await lastValueFrom(
      this.httpService.post<Customer>(`/customers/${customer_id}`, update_data),
    );
    return response.data;
  }

  /**
   * Deletes a customer by their unique identifier.
   * @param {string} customer_id - The ID of the customer to delete.
   * @returns {Promise<DeleteItemResponse>} - A promise that resolves to the deletion response.
   */
  public async deleteCustomer(
    customer_id: string,
  ): Promise<DeleteItemResponse> {
    const response = await lastValueFrom(
      this.httpService.delete<DeleteItemResponse>(`/customers/${customer_id}`),
    );
    return response.data;
  }

  /**
   * Lists customers, optionally paginated.
   * @param {number} [per_page=10] - The number of customers to return per page.
   * @param {number} [page=1] - The page number to retrieve.
   * @returns {Promise<ListResponse<Customer>>} - A promise that resolves to a paginated list of customers.
   */
  public async listCustomers(
    per_page: number = DEFAULT_PER_PAGE,
    page: number = DEFAULT_PAGE,
  ): Promise<ListResponse<Customer>> {
    const response = await lastValueFrom(
      this.httpService.get<ListResponse<Customer>>('/customers', {
        params: { per_page, page },
      }),
    );
    return response.data;
  }

  /**
   * Creates a new product with the given details.
   * @param {CreateProductParams} product_data - The data for creating the product.
   * @returns {Promise<Product>} The created product.
   */
  public async createProduct(
    product_data: CreateProductParams,
  ): Promise<Product> {
    const response = await lastValueFrom(
      this.httpService.post<Product>('/products', product_data),
    );
    return response.data;
  }

  /**
   * Updates an existing product identified by its ID.
   * @param {string} product_id - The ID of the product to update.
   * @param {UpdateProductParams} update_data - The data to update the product with.
   * @returns {Promise<Product>} The updated product.
   */
  public async updateProduct(
    product_id: string,
    update_data: UpdateProductParams,
  ): Promise<Product> {
    const response = await lastValueFrom(
      this.httpService.post<Product>(`/products/${product_id}`, update_data),
    );
    return response.data;
  }

  /**
   * Retrieves a single product by its ID.
   * @param {string} product_id - The ID of the product to retrieve.
   * @returns {Promise<Product>} The requested product.
   */
  public async getProduct(product_id: string): Promise<Product> {
    const response = await lastValueFrom(
      this.httpService.get<Product>(`/products/${product_id}`),
    );
    return response.data;
  }

  /**
   * Lists all products with optional pagination.
   * @param {number} [per_page=10] - The number of products to return per page.
   * @param {number} [page=1] - The page number to retrieve.
   * @returns {Promise<ListResponse<Product>>} A paginated list of products.
   */
  public async listProducts(
    per_page: number = DEFAULT_PER_PAGE,
    page: number = DEFAULT_PAGE,
  ): Promise<ListResponse<Product>> {
    const response = await lastValueFrom(
      this.httpService.get<ListResponse<Product>>('/products', {
        params: { per_page, page },
      }),
    );
    return response.data;
  }

  /**
   * Deletes a product by its ID.
   * @param {string} product_id - The ID of the product to delete.
   * @returns {Promise<DeleteItemResponse>} Confirmation of the product deletion.
   */
  public async deleteProduct(product_id: string): Promise<DeleteItemResponse> {
    const response = await lastValueFrom(
      this.httpService.delete<DeleteItemResponse>(`/products/${product_id}`),
    );
    return response.data;
  }

  /**
   * Retrieves all prices associated with a product, with optional pagination.
   * @param {string} product_id - The ID of the product whose prices are to be retrieved.
   * @param {number} [per_page=10] - The number of prices to return per page.
   * @param {number} [page=1] - The page number to retrieve.
   * @returns {Promise<ListResponse<ProductPrice>>} A paginated list of prices for the specified product.
   */
  public async getProductPrices(
    product_id: string,
    per_page: number = DEFAULT_PER_PAGE,
    page: number = DEFAULT_PAGE,
  ): Promise<ListResponse<ProductPrice>> {
    const response = await lastValueFrom(
      this.httpService.get<ListResponse<ProductPrice>>(
        `/products/${product_id}/prices`,
        {
          params: { per_page, page },
        },
      ),
    );
    return response.data;
  }

  /**
   * Creates a new price for a product.
   * @param {CreatePriceParams} price_data - The details of the new price to be created.
   * @returns {Promise<Price>} The created price object.
   */
  public async createPrice(price_data: CreatePriceParams): Promise<Price> {
    const response = await lastValueFrom(
      this.httpService.post<Price>('/prices', price_data),
    );
    return response.data;
  }

  /**
   * Updates the details of an existing price.
   * @param {string} price_id - The ID of the price to be updated.
   * @param {UpdatePriceParams} update_data - The new details for the price.
   * @returns {Promise<Price>} The updated price object.
   */
  public async updatePrice(
    price_id: string,
    update_data: UpdatePriceParams,
  ): Promise<Price> {
    const response = await lastValueFrom(
      this.httpService.post<Price>(`/prices/${price_id}`, update_data),
    );
    return response.data;
  }

  /**
   * Retrieves a single price by its ID.
   * @param {string} price_id - The ID of the price to retrieve.
   * @returns {Promise<Price>} The requested price object.
   */
  public async getPrice(price_id: string): Promise<Price> {
    const response = await lastValueFrom(
      this.httpService.get<Price>(`/prices/${price_id}`),
    );
    return response.data;
  }

  /**
   * Lists all prices for products with optional pagination.
   * @param {number} [per_page=10] - The number of price objects to return per page.
   * @param {number} [page=1] - The page number to retrieve.
   * @returns {Promise<ListResponse<Price>>} A paginated list of prices.
   */
  public async listPrices(
    per_page: number = DEFAULT_PER_PAGE,
    page: number = DEFAULT_PAGE,
  ): Promise<ListResponse<Price>> {
    const response = await lastValueFrom(
      this.httpService.get<ListResponse<Price>>('/prices', {
        params: { per_page, page },
      }),
    );
    return response.data;
  }

  /**
   * Creates a new checkout session with the specified details.
   * @param {CreateCheckoutParams} checkout_data - The details for the new checkout session.
   * @returns {Promise<Checkout>} The created checkout object.
   */
  public async createCheckout(
    checkout_data: CreateCheckoutParams,
  ): Promise<Checkout> {
    if (
      !checkout_data.success_url.startsWith('http') &&
      !checkout_data.success_url.startsWith('https')
    ) {
      throw new BadRequestException(
        'Invalid success_url, it must begin with http or https.',
      );
    }

    if (
      !checkout_data.items &&
      (!checkout_data.amount || !checkout_data.currency)
    ) {
      throw new BadRequestException(
        'The items field is required when amount and currency are not present.',
      );
    }

    const response = await lastValueFrom(
      this.httpService.post<Checkout>('/checkouts', checkout_data),
    );
    return response.data;
  }

  /**
   * Retrieves details of a specific checkout session by its ID.
   * @param {string} checkout_id - The ID of the checkout session to retrieve.
   * @returns {Promise<Checkout>} The requested checkout object.
   */
  public async getCheckout(checkout_id: string): Promise<Checkout> {
    const response = await lastValueFrom(
      this.httpService.get<Checkout>(`/checkouts/${checkout_id}`),
    );
    return response.data;
  }

  /**
   * Lists all checkout sessions with optional pagination.
   * @param {number} [per_page=10] - The number of checkout objects to return per page.
   * @param {number} [page=1] - The page number to retrieve.
   * @returns {Promise<ListResponse<Checkout>>} A paginated list of checkout sessions.
   */
  public async listCheckouts(
    per_page: number = DEFAULT_PER_PAGE,
    page: number = DEFAULT_PAGE,
  ): Promise<ListResponse<Checkout>> {
    const response = await lastValueFrom(
      this.httpService.get<ListResponse<Checkout>>('/checkouts', {
        params: { per_page, page },
      }),
    );
    return response.data;
  }

  /**
   * Retrieves all items included in a specific checkout session, with optional pagination.
   * @param {string} checkout_id - The ID of the checkout session.
   * @param {number} [per_page=10] - The number of items to return per page.
   * @param {number} [page=1] - The page number to retrieve.
   * @returns {Promise<ListResponse<any>>} A paginated list of items in the checkout session.
   */
  public async getCheckoutItems(
    checkout_id: string,
    per_page: number = DEFAULT_PER_PAGE,
    page: number = DEFAULT_PAGE,
  ): Promise<ListResponse<any>> {
    const response = await lastValueFrom(
      this.httpService.get<ListResponse<any>>(
        `/checkouts/${checkout_id}/items`,
        {
          params: { per_page, page },
        },
      ),
    );
    return response.data;
  }

  /**
   * Expires a specific checkout session before its automatic expiration.
   * @param {string} checkout_id - The ID of the checkout session to expire.
   * @returns {Promise<Checkout>} The expired checkout object, indicating the session is no longer valid for payment.
   */
  public async expireCheckout(checkout_id: string): Promise<Checkout> {
    const response = await lastValueFrom(
      this.httpService.post<Checkout>(`/checkouts/${checkout_id}/expire`, null),
    );
    return response.data;
  }

  /**
   * Creates a new payment link.
   * @param {CreatePaymentLinkParams} payment_link_data - The details for the new payment link.
   * @returns {Promise<PaymentLink>} The created payment link object.
   */
  public async createPaymentLink(
    payment_link_data: CreatePaymentLinkParams,
  ): Promise<PaymentLink> {
    const response = await lastValueFrom(
      this.httpService.post<PaymentLink>('/payment-links', payment_link_data),
    );
    return response.data;
  }

  /**
   * Updates an existing payment link identified by its ID.
   * @param {string} payment_link_id - The ID of the payment link to update.
   * @param {UpdatePaymentLinkParams} update_data - The new details for the payment link.
   * @returns {Promise<PaymentLink>} The updated payment link object.
   */
  public async updatePaymentLink(
    payment_link_id: string,
    update_data: UpdatePaymentLinkParams,
  ): Promise<PaymentLink> {
    const response = await lastValueFrom(
      this.httpService.post<PaymentLink>(
        `/payment-links/${payment_link_id}`,
        update_data,
      ),
    );
    return response.data;
  }

  /**
   * Retrieves details of a specific payment link by its ID.
   * @param {string} payment_link_id - The ID of the payment link to retrieve.
   * @returns {Promise<PaymentLink>} The requested payment link object.
   */
  public async getPaymentLink(payment_link_id: string): Promise<PaymentLink> {
    const response = await lastValueFrom(
      this.httpService.get<PaymentLink>(`/payment-links/${payment_link_id}`),
    );
    return response.data;
  }

  /**
   * Lists all payment links with optional pagination.
   * @param {number} [per_page=10] - The number of payment link objects to return per page.
   * @param {number} [page=1] - The page number to retrieve.
   * @returns {Promise<ListResponse<PaymentLink>>} A paginated list of payment links.
   */
  public async listPaymentLinks(
    per_page: number = DEFAULT_PER_PAGE,
    page: number = DEFAULT_PAGE,
  ): Promise<ListResponse<PaymentLink>> {
    const response = await lastValueFrom(
      this.httpService.get<ListResponse<PaymentLink>>('/payment-links', {
        params: { per_page, page },
      }),
    );
    return response.data;
  }

  /**
   * Retrieves all items associated with a specific payment link, with optional pagination.
   * @param {string} payment_link_id - The ID of the payment link whose items are to be retrieved.
   * @param {number} [per_page=10] - The number of items to return per page.
   * @param {number} [page=1] - The page number to retrieve.
   * @returns {Promise<ListResponse<any>>} A paginated list of items associated with the payment link.
   */
  public async getPaymentLinkItems(
    payment_link_id: string,
    per_page: number = DEFAULT_PER_PAGE,
    page: number = DEFAULT_PAGE,
  ): Promise<ListResponse<any>> {
    const response = await lastValueFrom(
      this.httpService.get<ListResponse<any>>(
        `/payment-links/${payment_link_id}/items`,
        {
          params: { per_page, page },
        },
      ),
    );
    return response.data;
  }
}
