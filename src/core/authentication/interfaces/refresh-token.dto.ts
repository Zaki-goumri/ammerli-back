export interface RefreshTokenPayload {
  id: number; // User ID
  phoneNumber: string; // User number
  iat?: number; // Issued at time (optional)
  exp?: number; // Expiration time (optional)
}
