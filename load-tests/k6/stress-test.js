// load-tests/k6/stress-test.js
import { buyerFlow } from './scenarios/buyer-flow.js';
import { textSummary } from 'https://jslib.k6.io/k6-utils/1.4.0/index.js';

export const options = {
  scenarios: {
    stress: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 50 }, // Ramp up to 10 VUs in 1 minute
        { duration: '3m', target: 500 }, // Stay at 50 VUs for 3 minutes
        { duration: '1m', target: 50 }, // Ramp down to 0 VUs in 1 minute
      ],
      gracefulRampDown: '30s',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.05'], // http errors should be less than 5%
    http_req_duration: ['p(95)<1000'], // 95% of requests should be below 1000ms
  },
};

export default function () {
  buyerFlow();
}

export function handleSummary(data) {
  console.log('Finished executing stress test');

  return {
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
    'summary.json': JSON.stringify(data),
  };
}
