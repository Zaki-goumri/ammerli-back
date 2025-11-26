// load-tests/k6/scenarios/seller-flow.js
import { group, sleep } from 'k6';
import http from 'k6/http';
import { authenticate } from './auth.js';
import { get, del, checkResponse } from '../common/api.js';
import { BASE_URL } from '../config.js';

const dummyImage = open('../../data/dummy-image.png', 'b');

export function sellerFlow() {
  const accessToken = authenticate();

  if (!accessToken) {
    console.error('Failed to authenticate, skipping seller flow.');
    return;
  }

  const authHeaders = {
    Authorization: `Bearer ${accessToken}`,
  };

  group('Seller Flow', () => {
    let listProductsRes = get('/products/admin/all', authHeaders);
    checkResponse(listProductsRes, 200, 'List Wholeseller Products');
    sleep(1);

    const createPayload = {
      name: `Test Product ${__VU}-${__ITER}`,
      price: 150,
      quantity: 100,
      brandId: 1,
      categoryId: 1,
      quantityPerBatch: 10,
      pictures: http.file(dummyImage, 'dummy-image.png', 'image/png'),
    };

    let createProductRes = http.post(
      `${BASE_URL}/products/create`,
      createPayload,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    );
    checkResponse(createProductRes, 201, 'Create Product');
    sleep(1);

    let newProductId = null;
    if (createProductRes.status === 201) {
      newProductId = createProductRes.json('id');
    }

    if (newProductId) {
      const updatePayload = {
        name: `Updated Product ${__VU}-${__ITER}`,
        price: 160,
      };
      let updateProductRes = http.put(
        `${BASE_URL}/products/${newProductId}`,
        updatePayload,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      );
      checkResponse(updateProductRes, 200, 'Update Product');
      sleep(1);

      let deleteProductRes = del(
        `/products/${newProductId}`,
        null,
        authHeaders,
      );
      checkResponse(deleteProductRes, 204, 'Delete Product');
      sleep(1);
    } else {
      console.warn('Failed to create a product, skipping update and delete.');
    }
  });
}
