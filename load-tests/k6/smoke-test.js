// load-tests/k6/smoke-test.js
import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js';
import { buyerFlow } from './scenarios/buyer-flow.js';
import { textSummary } from 'https://jslib.k6.io/k6-utils/1.4.0/index.js';

export const options = {
  vus: 1,
  duration: '10s',
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<500'],
  },
};

export default function () {
  buyerFlow();
}

export function handleSummary(data) {
  console.log('Finished executing smoke test');

  return {
    'summary.html': htmlReport(data),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
    'summary.json': JSON.stringify(data),
  };
}
