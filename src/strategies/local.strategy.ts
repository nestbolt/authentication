import { Injectable, Inject, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy } from "passport-local";
import { AUTHENTICATION_OPTIONS } from "../authentication.constants";
import { AuthenticationModuleOptions } from "../interfaces";
import { AuthService } from "../services/auth.service";

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy, "local") {
  constructor(
    private authService: AuthService,
    @Inject(AUTHENTICATION_OPTIONS) options: AuthenticationModuleOptions,
  ) {
    super({
      usernameField: options.usernameField ?? "email",
      passwordField: "password",
    });
  }

  async validate(username: string, password: string): Promise<any> {
    const user = await this.authService.validateCredentials(username, password);
    if (!user) {
      throw new UnauthorizedException("These credentials do not match our records.");
    }
    return user;
  }
}
