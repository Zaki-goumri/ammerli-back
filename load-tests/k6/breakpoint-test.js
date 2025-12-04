import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js';
import { buyerFlow } from './scenarios/buyer-flow.js';

export const options = {
  scenarios: {
    breakpoint: {
      executor: 'ramping-arrival-rate',
      startRate: 10,
      timeUnit: '1s',
      preAllocatedVUs: 100,
      maxVUs: 3000,
      stages: [
        { duration: '1m', target: 50 },
        { duration: '2m', target: 100 },
        { duration: '2m', target: 200 },
        { duration: '2m', target: 400 },
        { duration: '2m', target: 600 },
        { duration: '2m', target: 800 },
      ],
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.2'],
    http_req_duration: ['p(95)<5000'],
  },
};

export default function () {
  buyerFlow();
}

export function handleSummary(data) {
  console.log('Finished executing breakpoint test');

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
