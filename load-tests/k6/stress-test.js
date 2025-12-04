import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js';
import { buyerFlow } from './scenarios/buyer-flow.js';

export const options = {
  scenarios: {
    stress: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 100 },
        { duration: '3m', target: 300 },
        { duration: '3m', target: 600 },
        { duration: '2m', target: 300 },
        { duration: '1m', target: 0 },
      ],
      gracefulRampDown: '30s',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.05'],
    http_req_duration: ['p(95)<2000', 'p(99)<3000'],
    http_req_waiting: ['p(95)<1500'],
  },
};

export default function () {
  buyerFlow();
}

export function handleSummary(data) {
  console.log('Finished executing stress test');

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
    jsonReportContent = JSON.stringify(data, null, 2); // Pretty print for readability
  } catch (e) {
    console.error(`Error generating JSON report: ${e}`);
  }

  return {
    'summary.html': htmlReportContent,
    'summary.json': jsonReportContent,
  };
}
