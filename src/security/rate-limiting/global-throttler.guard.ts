import { Injectable } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerException } from '@nestjs/throttler';
import { ExecutionContext } from '@nestjs/common';

@Injectable()
export class GlobalThrottlerGuard extends ThrottlerGuard {
  /**
   * Extract real client IP from X-Forwarded-For header (set by Traefik)
   * This ensures rate limiting works per real user IP, not Traefik's IP
   */
  protected async getTracker(req: Record<string, any>): Promise<string> {
    return this.getRealClientIP(req);
  }

  /**
   * Get the real client IP address from request headers
   * Priority: X-Forwarded-For > X-Real-IP > Connection IP
   */
  private getRealClientIP(req: any): string {
    // 1. Check X-Forwarded-For header (from Traefik reverse proxy)
    const forwardedFor = req.headers['x-forwarded-for'];
    if (forwardedFor) {
      // X-Forwarded-For can be: "client, proxy1, proxy2"
      // Take the first IP (real client)
      const ips = forwardedFor.split(',').map((ip: string) => ip.trim());
      return ips[0];
    }

    // 2. Check X-Real-IP header
    if (req.headers['x-real-ip']) {
      return req.headers['x-real-ip'];
    }

    // 3. Fallback to direct connection IP
    return req.ip || req.connection?.remoteAddress || 'unknown';
  }

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
