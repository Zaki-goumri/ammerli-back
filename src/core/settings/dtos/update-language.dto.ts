import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { Language } from '../entities/settings.entity';

export class UpdateLanguageDto {
  @ApiProperty({
    description: 'User preferred language',
    enum: Language,
    example: Language.EN,
  })
  @IsEnum(Language)
  language: Language;
}
