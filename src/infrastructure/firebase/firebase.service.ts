import { Injectable, Inject } from '@nestjs/common';
import * as admin from 'firebase-admin';

@Injectable()
export class FirebaseService {
  constructor(@Inject('FIREBASE_APP') private readonly firebaseApp: admin.app.App) {}

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
}
