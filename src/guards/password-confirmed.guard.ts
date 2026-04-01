import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
} from "@nestjs/common";
import { AUTHENTICATION_OPTIONS } from "../authentication.constants";
import { AuthenticationModuleOptions, AuthUser } from "../interfaces";

@Injectable()
export class PasswordConfirmedGuard implements CanActivate {
  constructor(@Inject(AUTHENTICATION_OPTIONS) private options: AuthenticationModuleOptions) {}

  canActivate(context: ExecutionContext): boolean {
    if (!this.options.twoFactorOptions?.confirmPassword) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user as AuthUser;
    if (!user?.passwordConfirmedAt) {
      throw new ForbiddenException("Password confirmation required.");
    }

    const timeout = this.options.passwordTimeout ?? 900;
    const confirmedAt = new Date(user.passwordConfirmedAt).getTime();
    const now = Date.now();
    if ((now - confirmedAt) / 1000 > timeout) {
      throw new ForbiddenException("Password confirmation has expired.");
    }

    return true;
  }
}
