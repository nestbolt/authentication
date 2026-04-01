import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Inject,
  Optional,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { AUTHENTICATION_OPTIONS } from "../authentication.constants";
import { CurrentUser, Public } from "../decorators";
import { LoginDto } from "../dto/login.dto";
import { AUTH_EVENTS } from "../events";
import { JwtAuthGuard } from "../guards/jwt-auth.guard";
import { LoginThrottleGuard } from "../guards/login-throttle.guard";
import { CanonicalizeUsernameInterceptor } from "../interceptors/canonicalize-username.interceptor";
import { AuthenticationModuleOptions, AuthUser, EventEmitterLike, Feature } from "../interfaces";
import { AuthService } from "../services/auth.service";

@Controller()
export class AuthController {
  constructor(
    private authService: AuthService,
    private loginThrottleGuard: LoginThrottleGuard,
    @Inject(AUTHENTICATION_OPTIONS) private options: AuthenticationModuleOptions,
    @Optional() @Inject("EventEmitter2") private eventEmitter?: EventEmitterLike,
  ) {}

  @Post("login")
  @Public()
  @UseGuards(LoginThrottleGuard)
  @UseInterceptors(CanonicalizeUsernameInterceptor)
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginDto: LoginDto,
    @Req() request: { body: Record<string, unknown>; ip?: string },
  ) {
    const usernameField = this.options.usernameField ?? "email";
    const username = (loginDto as Record<string, any>)[usernameField];
    const user = await this.authService.validateCredentials(username, loginDto.password);

    if (!user) {
      this.loginThrottleGuard.increment(request);
      throw new UnauthorizedException("Invalid credentials.");
    }

    this.loginThrottleGuard.clear(request);

    if (this.options.features.includes(Feature.TWO_FACTOR_AUTHENTICATION)) {
      if (this.authService.userRequiresTwoFactor(user)) {
        const challengeToken = await this.authService.createTwoFactorChallenge(
          user,
          loginDto.remember ?? false,
        );
        this.eventEmitter?.emit?.(AUTH_EVENTS.TWO_FACTOR_CHALLENGED, { user });
        return { twoFactor: true, challengeToken };
      }
    }

    const tokens = await this.authService.generateTokens(user);
    this.eventEmitter?.emit?.(AUTH_EVENTS.LOGIN, { user });
    return { twoFactor: false, ...tokens };
  }

  @Post("refresh")
  @Public()
  @UseGuards(AuthGuard("jwt-refresh"))
  @HttpCode(HttpStatus.OK)
  async refresh(@Req() request: { user: AuthUser }) {
    const tokens = await this.authService.generateTokens(request.user);
    return { ...tokens };
  }

  @Post("logout")
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logout(@CurrentUser() user: AuthUser) {
    this.eventEmitter?.emit?.(AUTH_EVENTS.LOGOUT, { user });
    return { message: "Logged out successfully." };
  }
}
