import { Injectable } from '@nestjs/common';
import { FirebaseService } from 'src/infrastructure/firebase/firebase.service';

@Injectable()
export class FcmService {
  constructor(private readonly firebaseService: FirebaseService) {}

  async sendNotification(
    token: string,
    title: string,
    body: string,
  ): Promise<any> {
    const message = {
      notification: {
        title,
        body,
      },
      token: token,
    };

    try {
      const response = await this.firebaseService.getFcm().send(message);
      console.log('Successfully sent message:', response);
      return { success: true, response };
    } catch (error) {
      console.error('Error sending message:', error);
      return { success: false, error: error.message };
    }
  }
}
