// load-tests/k6/scenarios/buyer-flow.js
import { group, sleep } from 'k6';
import { authenticate } from './auth.js';
import { get, post, checkResponse } from '../common/api.js';

export function buyerFlow() {
  const accessToken = authenticate();

  if (!accessToken) {
    console.error('Failed to authenticate, skipping buyer flow.');
    return;
  }

  const authHeaders = {
    Authorization: `Bearer ${accessToken}`,
  };

  group('Buyer Flow', () => {
    let productsRes = get('/products/all?page=1&limit=10', authHeaders);
    checkResponse(productsRes, 200, 'Get All Products');
    let products = productsRes.json('data');
    sleep(1);

    let productId = null;
    if (products && products.length > 0) {
      productId = products[0].id;
    }

    if (productId) {
      let productDetailRes = get(`/products/${productId}`, authHeaders);
      checkResponse(productDetailRes, 200, 'Get Single Product');
      sleep(1);

      let toggleFavoriteRes = post(
        `/products/${productId}/toggle-favorite`,
        {},
        authHeaders,
      );
      checkResponse(toggleFavoriteRes, 200, 'Toggle Favorite Product');
      sleep(1);
    } else {
      console.warn('No products found to view or favorite.');
    }

    let orderPayload = {
      items: [{ productId: productId || 1, quantity: 1 }],
      paymentWay: 'CASH',
      address: {
        street: `Test Street ${__VU}-${__ITER}`,
        city: 'Algiers',
        district: 'Algiers Center',
      },
    };
    let createOrderRes = post('/order', orderPayload, authHeaders);
    checkResponse(createOrderRes, 201, 'Create Order with New Address');
    sleep(1);
  });
}
