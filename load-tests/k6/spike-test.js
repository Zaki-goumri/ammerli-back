import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js';
import { buyerFlow } from './scenarios/buyer-flow.js';

export const options = {
  scenarios: {
    spike: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '10s', target: 50 },
        { duration: '30s', target: 500 },
        { duration: '10s', target: 1500 },
        { duration: '1m', target: 1500 },
        { duration: '30s', target: 50 },
        { duration: '20s', target: 0 },
      ],
      gracefulRampDown: '30s',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.1'],
    http_req_duration: ['p(95)<3000'],
  },
};

export default function () {
  buyerFlow();
}

export function handleSummary(data) {
  console.log('Finished executing spike test');

  if (typeof data !== 'object' || data === null) {
    console.error('handleSummary: Received invalid data object:', data);
    return {
      'error-report.txt': 'Received invalid data for summary generation.',
    };
  }

  let htmlReportContent = 'Error generating HTML report.';
  try {
    htmlReportContent = htmlReport(data);
  } catch (e) {
    console.error(`Error generating HTML report: ${e}`);
  }

  let jsonReportContent = 'Error generating JSON report.';
  try {
    jsonReportContent = JSON.stringify(data, null, 2);
  } catch (e) {
    console.error(`Error generating JSON report: ${e}`);
  }

  return {
    'summary.html': htmlReportContent,
    'summary.json': jsonReportContent,
  };
}
