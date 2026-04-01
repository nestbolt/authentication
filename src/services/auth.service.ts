import { Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { AUTHENTICATION_OPTIONS, USER_REPOSITORY } from "../authentication.constants";
import { AuthenticationModuleOptions, AuthUser, UserRepository } from "../interfaces";

@Injectable()
export class AuthService {
  constructor(
    @Inject(USER_REPOSITORY) private userRepository: UserRepository,
    @Inject(AUTHENTICATION_OPTIONS) private options: AuthenticationModuleOptions,
    private jwtService: JwtService,
  ) {}

  async validateCredentials(username: string, password: string): Promise<AuthUser | null> {
    const field = this.options.usernameField ?? "email";
    const user = await this.userRepository.findByField(field, username);
    if (!user) {
      return null;
    }
    const valid = await bcrypt.compare(password, user.password);
    return valid ? user : null;
  }

  async generateTokens(user: AuthUser): Promise<{ accessToken: string; refreshToken: string }> {
    const payload = { sub: user.id, email: user.email };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.options.jwtSecret,
      expiresIn: this.options.jwtExpiresIn ?? "15m",
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.options.refreshSecret,
      expiresIn: this.options.refreshExpiresIn ?? "7d",
    });

    return { accessToken, refreshToken };
  }

  async createTwoFactorChallenge(user: AuthUser, remember: boolean): Promise<string> {
    return this.jwtService.sign(
      { sub: user.id, purpose: "2fa-challenge", remember },
      { secret: this.options.jwtSecret, expiresIn: "5m" },
    );
  }

  async getChallengedUser(challengeToken: string): Promise<{ user: AuthUser; remember: boolean }> {
    try {
      const payload = this.jwtService.verify(challengeToken, {
        secret: this.options.jwtSecret,
      });
      if (payload.purpose !== "2fa-challenge") {
        throw new UnauthorizedException("Invalid challenge token.");
      }
      const user = await this.userRepository.findById(payload.sub);
      if (!user) {
        throw new UnauthorizedException("Invalid challenge token.");
      }
      return { user, remember: payload.remember ?? false };
    } catch {
      throw new UnauthorizedException("Invalid or expired challenge token.");
    }
  }

  userRequiresTwoFactor(user: AuthUser): boolean {
    if (!user.twoFactorSecret) {
      return false;
    }
    if (this.options.twoFactorOptions?.confirm) {
      return user.twoFactorConfirmedAt !== null;
    }
    return true;
  }
}
