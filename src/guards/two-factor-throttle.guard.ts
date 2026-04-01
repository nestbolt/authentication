import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
} from "@nestjs/common";
import { AUTHENTICATION_OPTIONS } from "../authentication.constants";
import { AuthenticationModuleOptions } from "../interfaces";

interface ThrottleRequest {
  body?: Record<string, unknown>;
  ip?: string;
}

@Injectable()
export class TwoFactorThrottleGuard implements CanActivate {
  private attempts = new Map<string, { count: number; resetAt: number }>();

  constructor(@Inject(AUTHENTICATION_OPTIONS) private options: AuthenticationModuleOptions) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const key = this.throttleKey(request);
    const now = Date.now();
    const config = this.options.twoFactorRateLimit ?? { ttl: 60000, limit: 5 };

    const record = this.attempts.get(key);
    if (record && now < record.resetAt && record.count >= config.limit) {
      const seconds = Math.ceil((record.resetAt - now) / 1000);
      throw new HttpException(
        { message: `Too many two-factor attempts. Please try again in ${seconds} seconds.` },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    return true;
  }

  increment(request: ThrottleRequest): void {
    const key = this.throttleKey(request);
    const now = Date.now();
    const config = this.options.twoFactorRateLimit ?? { ttl: 60000, limit: 5 };
    const record = this.attempts.get(key) ?? { count: 0, resetAt: now + config.ttl };
    if (now >= record.resetAt) {
      record.count = 1;
      record.resetAt = now + config.ttl;
    } else {
      record.count++;
    }
    this.attempts.set(key, record);
  }

  clear(request: ThrottleRequest): void {
    this.attempts.delete(this.throttleKey(request));
  }

  private throttleKey(request: ThrottleRequest): string {
    const ip = request.ip ?? "";
    return `2fa|${ip}`;
  }
}
