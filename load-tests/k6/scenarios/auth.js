// load-tests/k6/scenarios/auth.js
import { SharedArray } from 'k6/data';
import { group, sleep } from 'k6';
import papaparse from 'https://jslib.k6.io/papaparse/5.1.1/index.js';
import { post, put, checkResponse } from '../common/api.js';
import { TEST_OTP } from '../config.js';

const phoneNumbers = new SharedArray('phoneNumbers', function () {
  const parsedData = papaparse.parse(open('../../data/phone-numbers.csv'), {
    header: true,
  }).data;
  return parsedData.filter(
    (user) => user.phoneNumber && user.phoneNumber.trim() !== '',
  );
});

export function authenticate() {
  const user = phoneNumbers[__VU % phoneNumbers.length];
  const phoneNumber = user.phoneNumber;
  let accessToken = '';

  group('Authentication Flow', () => {
    // 1. Send OTP
    let sendOtpRes = post('/authentication/otp/send', { phoneNumber });
    checkResponse(sendOtpRes, 201, 'Send OTP');
    sleep(15);

    // 2. Validate OTP
    let validateOtpRes = post('/authentication/otp/validate', {
      phoneNumber,
      otp: TEST_OTP,
    });
    checkResponse(validateOtpRes, 200, 'Validate OTP');

    if (validateOtpRes.status === 200) {
      const validationData = validateOtpRes.json();
      accessToken = validationData.accessToken;

      if (validationData.isRegistered === false) {
        const registerPayload = {
          name: `Test User ${__VU}`,
          supermarketName: `Supermarket ${__VU}`,
          address: {
            street: `Test Street ${__VU}`,
            city: 'Algiers',
            district: 'Algiers Center',
          },
        };

        const regHeaders = {
          Authorization: `Bearer ${accessToken}`,
        };

        let registerRes = put(
          '/authentication/register',
          registerPayload,
          regHeaders,
        );
        checkResponse(registerRes, 200, 'Register User');

        if (registerRes.status === 200) {
          accessToken = registerRes.json('accessToken');
        }
      }
    }
    sleep(1);
  });

  return accessToken;
}
