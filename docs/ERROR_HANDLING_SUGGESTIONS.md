# Error Handling and Logic Suggestions

This document lists suggestions for improving error handling, i18n keys, and unhandled logic edge cases discovered during the refactoring process.

---

### `src/core/authentication/strategies/otp/smssak-otp.strategy.ts`

*   **Method:** `sendOtp`
    *   **Suggestion:** The method currently throws a generic `new Error('Failed to send OTP via SMS provider')`. This error is not an `HttpException` and will not be caught by the global exception filter, resulting in an unhandled exception and a 500 Internal Server Error response without proper formatting or translation.
    *   **Recommendation:** Replace `throw new Error(...)` with `throw new InternalServerErrorException({ key: 'auth.otp.providerFailed' })` and add the corresponding key to the i18n files. This will ensure consistent error handling.

---