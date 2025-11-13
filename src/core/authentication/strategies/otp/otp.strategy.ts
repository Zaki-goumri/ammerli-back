export abstract class OtpStrategy {
  abstract send(phoneNumber: string): Promise<void>;
  abstract verify(phoneNumber: string, otp: string): Promise<boolean>;
}
