import {
  Controller,
  Post,
  Body,
  Logger,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBadRequestResponse,
  ApiTooManyRequestsResponse,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
} from '@nestjs/swagger';
import { UserService } from '../user/user.service';
import { RequestAccountDeletionDto } from './dtos/requests/request-account-deletion.dto';
import { ConfirmAccountDeletionDto } from './dtos/requests/confirm-account-deletion.dto';
import { MessageDto } from '../user/dtos/response/message.dto';
import { OtpStrategy } from './strategies/otp/otp.strategy';
import { transformPhoneNumber } from 'src/common/utils/authentication/phone-number.utils';

/**
 * @class AccountDeletionController
 * @description Handles unauthenticated account deletion requests for Google Play Console compliance.
 * Provides a two-step process: request OTP and confirm deletion with OTP.
 *
 * @note Architecture Decision: This controller is placed in the AuthenticationModule instead of UserModule
 * to avoid circular dependency issues. While account deletion logically belongs to user management,
 * it requires OTP verification which is part of the authentication domain. Since:
 * - AuthenticationModule already imports UserModule (for user lookup during login)
 * - This controller needs OtpStrategy (owned by AuthenticationModule)
 * - This controller needs UserService (owned by UserModule)
 * Placing it here prevents the circular dependency: UserModule ⟷ AuthenticationModule.
 *
 * Alternative solutions considered:
 * 1. Create a separate OtpModule - would require significant refactoring
 * 2. Create a standalone AccountDeletionModule - adds unnecessary complexity
 * 3. Current approach - pragmatic solution that keeps OTP logic centralized
 */
@ApiTags('Account Deletion')
@ApiBadRequestResponse({ description: 'Bad request' })
@ApiTooManyRequestsResponse({
  description: 'Too many requests (Rate limiting)',
})
@ApiInternalServerErrorResponse({ description: 'Internal server error' })
@Controller('account-deletion')
export class AccountDeletionController {
  private readonly logger = new Logger(AccountDeletionController.name);

  constructor(
    private readonly userService: UserService,
    private readonly otpStrategy: OtpStrategy,
  ) {}

  /**
   * @method requestDeletion
   * @description Sends an OTP to the user's phone number to initiate account deletion.
   * @param {RequestAccountDeletionDto} dto - The phone number to send OTP to.
   * @returns {Promise<MessageDto>} Confirmation message that OTP was sent.
   */
  @Post('request')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Request account deletion - Send OTP',
    description:
      'Sends an OTP to the provided phone number to verify account ownership before deletion.',
  })
  @ApiOkResponse({
    description: 'OTP sent successfully',
    type: MessageDto,
  })
  async requestDeletion(
    @Body() dto: RequestAccountDeletionDto,
  ): Promise<MessageDto> {
    const phoneNumber = transformPhoneNumber(dto.phoneNumber);

    this.logger.log(
      `Account deletion requested for phone number: ${phoneNumber}`,
    );

    const user =
      await this.userService.findByPhoneNumberWithoutException(phoneNumber);

    if (!user) {
      this.logger.warn(
        `Account deletion request for non-existent user: ${phoneNumber}`,
      );
      return {
        message:
          'If an account exists with this phone number, you will receive an OTP.',
      };
    }

    await this.otpStrategy.send(phoneNumber);

    this.logger.log(`OTP sent for account deletion: ${phoneNumber}`);

    return {
      message: 'OTP sent successfully. Please check your phone.',
    };
  }

  /**
   * @method confirmDeletion
   * @description Verifies the OTP and deletes the user account if valid.
   * @param {ConfirmAccountDeletionDto} dto - Phone number and OTP code.
   * @returns {Promise<MessageDto>} Confirmation message of account deletion.
   */
  @Post('confirm')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Confirm account deletion - Verify OTP and delete account',
    description:
      'Verifies the OTP code and permanently deletes the user account if valid.',
  })
  @ApiOkResponse({
    description: 'Account deleted successfully',
    type: MessageDto,
  })
  async confirmDeletion(
    @Body() dto: ConfirmAccountDeletionDto,
  ): Promise<MessageDto> {
    const phoneNumber = transformPhoneNumber(dto.phoneNumber);

    this.logger.log(
      `Account deletion confirmation attempt for: ${phoneNumber}`,
    );

    const user =
      await this.userService.findByPhoneNumberWithoutException(phoneNumber);

    if (!user) {
      this.logger.warn(
        `Account deletion confirmation for non-existent user: ${phoneNumber}`,
      );
      return {
        message: 'Invalid OTP or phone number.',
      };
    }

    const isValid = await this.otpStrategy.verify(phoneNumber, dto.otp);

    if (!isValid) {
      this.logger.warn(
        `Invalid OTP for account deletion: ${phoneNumber}, userId: ${user.id}`,
      );
      return {
        message: 'Invalid or expired OTP. Please try again.',
      };
    }

    await this.userService.deleteUser(user.id);

    this.logger.log(
      `Account successfully deleted: ${phoneNumber}, userId: ${user.id}`,
    );

    return {
      message:
        'Your account has been successfully deleted. All your data will be removed.',
    };
  }
}
