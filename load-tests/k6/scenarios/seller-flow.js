// load-tests/k6/scenarios/seller-flow.js
import { group, sleep } from 'k6';
import http from 'k6/http';
import { authenticate } from './auth.js';
import { get, del, checkResponse } from '../common/api.js';
import { BASE_URL } from '../config.js';

// Dummy file content for image uploads
// k6 needs a binary representation of the file.
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
    // 1. List Wholeseller's Products
    let listProductsRes = get('/products/wholeseller/all', authHeaders);
    checkResponse(listProductsRes, 200, 'List Wholeseller Products');
    sleep(1);

    // 2. Create a new product
    const createPayload = {
      name: `Test Product ${__VU}-${__ITER}`,
      price: 150,
      quantity: 100,
      brandId: 1, // Assuming brandId 1 exists
      categoryId: 1, // Assuming categoryId 1 exists
      quantityPerBatch: 10,
      pictures: http.file(dummyImage, 'dummy-image.png', 'image/png'),
    };

    // For multipart requests, we can't use the JSON helper from api.js
    let createProductRes = http.post(`${BASE_URL}/products/create`, createPayload, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    checkResponse(createProductRes, 201, 'Create Product');
    sleep(1);

    let newProductId = null;
    if (createProductRes.status === 201) {
      newProductId = createProductRes.json('id');
    }

    if (newProductId) {
      // 3. Update the product
      const updatePayload = {
        name: `Updated Product ${__VU}-${__ITER}`,
        price: 160,
      };
      // The update endpoint also expects multipart/form-data
      let updateProductRes = http.put(`${BASE_URL}/products/${newProductId}`, updatePayload, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      checkResponse(updateProductRes, 200, 'Update Product');
      sleep(1);

      // 4. Delete the product
      let deleteProductRes = del(`/products/${newProductId}`, null, authHeaders);
      checkResponse(deleteProductRes, 204, 'Delete Product');
      sleep(1);
    } else {
      console.warn('Failed to create a product, skipping update and delete.');
    }
  });
}
