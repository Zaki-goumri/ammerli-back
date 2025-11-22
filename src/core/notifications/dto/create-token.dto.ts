import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { OsType } from '../enums/os-type.enum';
import { Language } from '../entities/token.entity';

export class CreateTokenDto {
  @ApiProperty({
    description: 'The fcm token string.',
    example: 'dummytoken1234567890abcdef',
  })
  @IsString()
  @IsNotEmpty()
  fcmToken: string;

  @ApiProperty({
    description: 'The operating system type of the device.',
    enum: OsType,
    example: OsType.ANDROID,
  })
  @IsNotEmpty()
  @IsEnum(OsType)
  os: OsType;

  @ApiProperty({
    description: 'The preferred language of the user.',
    example: 'en',
  })
  @IsString()
  @IsNotEmpty()
  lang: Language;
}
