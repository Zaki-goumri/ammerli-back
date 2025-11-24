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
    const request = context.switchToHttp().getRequest<Request>();
    const path = request.url;
    let messageKey = 'http.throttle.default';
    if (path.includes('/otp/send')) {
      messageKey = 'http.throttle.otp';
    }
    throw new ThrottlerException(messageKey);
  }
}
