import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { OsType } from '../enums/os-type.enum';

export class CreateTokenDto {
  @ApiProperty({
    description: 'The fcm token string.',
    example: 'dummytoken1234567890abcdef',
  })
  @IsString()
  @IsNotEmpty()
  fcmToken: string;
  @ApiProperty({
    description: 'The ID of the user associated with the token.',
    example: 1,
  })
  @IsNumber()
  @IsNotEmpty()
  userId: number;
  @ApiProperty({
    description: 'The operating system type of the device.',
    enum: OsType,
    example: OsType.ANDROID,
  })
  @IsNotEmpty()
  @IsEnum(OsType)
  os: OsType;
}
