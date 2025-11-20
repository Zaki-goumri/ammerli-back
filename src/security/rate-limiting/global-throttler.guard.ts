import { Injectable } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerException } from '@nestjs/throttler';
import { ExecutionContext } from '@nestjs/common';

@Injectable()
export class GlobalThrottlerGuard extends ThrottlerGuard {
  /**
   * Get the real client IP address from request
   * The RealIpMiddleware ensures req.ip is the correct client IP
   */
  protected async getTracker(req: Record<string, any>): Promise<string> {
    return req.ip;
  }

  protected async throwThrottlingException(
    context: ExecutionContext,
  ): Promise<void> {
    const request = context.switchToHttp().getRequest();
    const path = request.url;

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
