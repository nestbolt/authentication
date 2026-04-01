import { CallHandler, ExecutionContext, Inject, Injectable, NestInterceptor } from "@nestjs/common";
import { Observable } from "rxjs";
import { AUTHENTICATION_OPTIONS } from "../authentication.constants";
import { AuthenticationModuleOptions } from "../interfaces";

@Injectable()
export class CanonicalizeUsernameInterceptor implements NestInterceptor {
  constructor(@Inject(AUTHENTICATION_OPTIONS) private options: AuthenticationModuleOptions) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    if (this.options.lowercaseUsernames !== false) {
      const request = context.switchToHttp().getRequest();
      const field = this.options.usernameField ?? "email";
      if (request.body?.[field]) {
        request.body[field] = String(request.body[field]).toLowerCase();
      }
    }
    return next.handle();
  }
}
