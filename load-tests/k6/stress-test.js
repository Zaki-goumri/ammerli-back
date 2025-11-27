import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js';
import { buyerFlow } from './scenarios/buyer-flow.js';
import { textSummary } from 'https://jslib.k6.io/k6-utils/1.4.0/index.js';
import { authenticate } from './scenarios/auth.js';

export const options = {
  scenarios: {
    stress: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 50 },
        { duration: '1m', target: 100 },
        { duration: '1m', target: 700 },
      ],
      gracefulRampDown: '30s',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.1'],
    http_req_duration: ['p(95)<500'],
  },
};

export default function () {
  authenticate();
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

  let stdoutText = 'Error generating text summary.';
  try {
    stdoutText = textSummary(data, { indent: ' ', enableColors: true });
  } catch (e) {
    console.error(`Error generating text summary: ${e}`);
  }

  return {
    'summary.html': htmlReportContent,
    'summary.json': jsonReportContent,
    stdout: stdoutText,
  };
}
