import { Injectable } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerException } from '@nestjs/throttler';
import { ExecutionContext } from '@nestjs/common';

@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  protected async throwThrottlingException(
    context: ExecutionContext,
  ): Promise<void> {
    // Get the throttler name to provide context-specific messages
    const request = context.switchToHttp().getRequest();
    const path = request.url;

    // Custom messages based on endpoint
    let customMessage = 'Too many requests. Please try again later.';

    if (path.includes('/otp/send')) {
      customMessage =
        'Too many OTP requests. Please wait 30 seconds before requesting a new OTP.';
    } else if (path.includes('/login') || path.includes('/verify')) {
      customMessage = 'Too many login attempts. Please try again later.';
    }

    throw new ThrottlerException(customMessage);
  }
}
