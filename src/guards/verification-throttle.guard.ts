import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
} from "@nestjs/common";
import { AUTHENTICATION_OPTIONS } from "../authentication.constants";
import { AuthenticationModuleOptions, AuthUser } from "../interfaces";

@Injectable()
export class VerificationThrottleGuard implements CanActivate {
  private attempts = new Map<string, { count: number; resetAt: number }>();

  constructor(@Inject(AUTHENTICATION_OPTIONS) private options: AuthenticationModuleOptions) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const key = this.throttleKey(request);
    const now = Date.now();
    const config = this.options.verificationRateLimit ?? { ttl: 60000, limit: 6 };

    const record = this.attempts.get(key);
    if (record && now < record.resetAt && record.count >= config.limit) {
      const seconds = Math.ceil((record.resetAt - now) / 1000);
      throw new HttpException(
        { message: `Too many verification attempts. Please try again in ${seconds} seconds.` },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    if (!record || now >= record.resetAt) {
      this.attempts.set(key, { count: 1, resetAt: now + config.ttl });
    } else {
      record.count++;
    }

    return true;
  }

  private throttleKey(request: { user?: AuthUser; ip?: string }): string {
    const userId = request.user?.id ?? "";
    const ip = request.ip ?? "";
    return `verify|${userId}|${ip}`;
  }
}
