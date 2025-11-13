import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class FirebaseTokenDto {
  @ApiProperty({
    example: 'your_firebase_id_token_here',
    description: 'The Firebase ID token received from the client.',
  })
  @IsString()
  @IsNotEmpty()
  firebaseToken: string;
}
