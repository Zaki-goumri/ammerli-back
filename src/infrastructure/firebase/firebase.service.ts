import { Injectable, Inject } from '@nestjs/common';
import * as admin from 'firebase-admin';

@Injectable()
export class FirebaseService {
  constructor(
    @Inject('FIREBASE_APP') private readonly firebaseApp: admin.app.App,
  ) {}

  getAuth() {
    return this.firebaseApp.auth();
  }

  getFirestore() {
    return this.firebaseApp.firestore();
  }

  /**
   * Get the Firebase Cloud Messaging (FCM) service.
   * @returns The Firebase Cloud Messaging service.
   */
  getFcm() {
    return this.firebaseApp.messaging();
  }

  /**
   * Verify Firebase ID token
   * @param token - Firebase ID token from client
   * @returns Decoded token with user info
   */
  async verifyIdToken(token: string): Promise<admin.auth.DecodedIdToken> {
    return this.getAuth().verifyIdToken(token);
  }

  /**
   * Revoke all refresh tokens for a user.
   * @param {string} uid - The Firebase user ID.
   * @returns {Promise<void>} A promise that resolves when the refresh token revocation completes.
   */
  async revokeRefreshTokens(uid: string): Promise<void> {
    return this.getAuth().revokeRefreshTokens(uid);
  }

  /**
   * Disable a user account
   * @param uid - Firebase user ID
   */
  async disableUser(uid: string): Promise<admin.auth.UserRecord> {
    return this.getAuth().updateUser(uid, { disabled: true });
  }
}
