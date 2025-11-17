import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Settings } from './entities/settings.entity';
import { UpdateLanguageDto } from './dtos/update-language.dto';

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(Settings)
    private readonly settingsRepository: Repository<Settings>,
  ) {}

  /**
   * Update user language preference
   * @param userId - The user ID
   * @param updateLanguageDto - DTO containing the language preference
   * @returns Updated settings
   */
  async updateLanguage(
    userId: string,
    updateLanguageDto: UpdateLanguageDto,
  ): Promise<Settings> {
    let settings = await this.settingsRepository.findOne({
      where: { userId },
    });

    if (!settings) {
      settings = this.settingsRepository.create({
        userId,
        language: updateLanguageDto.language,
      });
    } else {
      settings.language = updateLanguageDto.language;
    }

    return this.settingsRepository.save(settings);
  }

  /**
   * Get user settings
   * @param userId - The user ID
   * @returns User settings or null if not found
   */
  async getUserSettings(userId: string): Promise<Settings | null> {
    return this.settingsRepository.findOne({
      where: { userId },
    });
  }
}
