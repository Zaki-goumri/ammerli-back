// load-tests/k6/common/api.js
import http from 'k6/http';
import { check } from 'k6';
import { BASE_URL } from '../config.js';

export function post(path, payload, headers = {}) {
  const res = http.post(`${BASE_URL}${path}`, JSON.stringify(payload), {
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  });
  return res;
}

export function get(path, headers = {}) {
  const res = http.get(`${BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  });
  return res;
}

export function put(path, payload, headers = {}) {
  const res = http.put(`${BASE_URL}${path}`, JSON.stringify(payload), {
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  });
  return res;
}

export function del(path, payload, headers = {}) {
  const res = http.del(`${BASE_URL}${path}`, JSON.stringify(payload), {
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  });
  return res;
}

export function checkResponse(res, expectedStatus, name) {
  const checks = {};
  checks[`${name} - status is ${expectedStatus}`] = (r) => r.status === expectedStatus;
  checks[`${name} - response time < 2000ms`] = (r) => r.timings.duration < 2000;

  const checkResult = check(res, checks);

  if (!checkResult) {
    // Log details on failure
    if (res.status !== expectedStatus) {
        console.error(`[FAIL] ${name}: Unexpected status code ${res.status} (expected ${expectedStatus})`);
        console.error(`Response body: ${res.body}`);
    }
  }
}
