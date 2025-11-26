// load-tests/k6/scenarios/auth.js
import { SharedArray } from 'k6/data';
import { group, sleep } from 'k6';
import papaparse from 'https://jslib.k6.io/papaparse/5.1.1/index.js';
import { post, checkResponse } from '../common/api.js';
import { TEST_OTP } from '../config.js';

// Load phone numbers from CSV
const phoneNumbers = new SharedArray('phoneNumbers', function () {
  // Use papaparse to parse the CSV data
  return papaparse.parse(open('../../data/phone-numbers.csv'), { header: true }).data;
});

export function authenticate() {
  // Use __VU (Virtual User ID) to pick a unique phone number for each VU
  // This helps avoid conflicts and simulates different users
  const user = phoneNumbers[__VU % phoneNumbers.length];
  const phoneNumber = user.phoneNumber;
  let accessToken = '';

  group('Authentication Flow', () => {
    // 1. Send OTP
    let sendOtpRes = post('/authentication/otp/send', { phoneNumber });
    checkResponse(sendOtpRes, 200, 'Send OTP');
    sleep(1); // Simulate user waiting for OTP

    // 2. Validate OTP
    // The API description says "Returns user if it is registered else register him"
    // So, this single call handles both login and initial registration for a new phone number.
    let validateOtpRes = post('/authentication/otp/validate', {
      phoneNumber,
      otp: TEST_OTP,
    });
    checkResponse(validateOtpRes, 200, 'Validate OTP');

    if (validateOtpRes.status === 200) {
      accessToken = validateOtpRes.json('accessToken');
      // Optionally, capture refreshToken if needed for refresh token flow testing
      // let refreshToken = validateOtpRes.json('refreshToken');
    }
    sleep(1); // Simulate user interaction after login
  });

  return accessToken;
}
