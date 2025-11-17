import { Controller, Put, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { UpdateLanguageDto } from './dtos/update-language.dto';
import { AccessTokenGuard } from '../authentication/guards/access-token.guard';
import { USER } from '../authentication/decorators/user.decorartor';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiOkResponse,
  ApiTags,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Settings } from './entities/settings.entity';

@ApiTags('settings')
@ApiBearerAuth()
@UseGuards(AccessTokenGuard)
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Put('language')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update user language preference' })
  @ApiOkResponse({
    description: 'Language preference updated successfully',
    type: Settings,
  })
  @ApiBadRequestResponse({ description: 'Invalid language value' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async updateLanguage(
    @USER('id') userId: string,
    @Body() updateLanguageDto: UpdateLanguageDto,
  ): Promise<Settings> {
    return this.settingsService.updateLanguage(userId, updateLanguageDto);
  }
}
