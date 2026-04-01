import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Inject,
  Optional,
  Post,
  Req,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { AUTHENTICATION_OPTIONS } from "../authentication.constants";
import { CurrentUser, Public } from "../decorators";
import { LoginDto } from "../dto/login.dto";
import { AUTH_EVENTS } from "../events";
import { JwtAuthGuard } from "../guards/jwt-auth.guard";
import { LocalAuthGuard } from "../guards/local-auth.guard";
import { LoginThrottleGuard } from "../guards/login-throttle.guard";
import { CanonicalizeUsernameInterceptor } from "../interceptors/canonicalize-username.interceptor";
import { AuthenticationModuleOptions, AuthUser, EventEmitterLike, Feature } from "../interfaces";
import { AuthService } from "../services/auth.service";

@Controller()
export class AuthController {
  constructor(
    private authService: AuthService,
    @Inject(AUTHENTICATION_OPTIONS) private options: AuthenticationModuleOptions,
    @Optional() @Inject("EventEmitter2") private eventEmitter?: EventEmitterLike,
  ) {}

  @Post("login")
  @Public()
  @UseGuards(LoginThrottleGuard, LocalAuthGuard)
  @UseInterceptors(CanonicalizeUsernameInterceptor)
  @HttpCode(HttpStatus.OK)
  async login(@Body() _loginDto: LoginDto, @Req() request: { user: AuthUser }) {
    const user = request.user;

    if (this.options.features.includes(Feature.TWO_FACTOR_AUTHENTICATION)) {
      if (this.authService.userRequiresTwoFactor(user)) {
        const challengeToken = await this.authService.createTwoFactorChallenge(
          user,
          _loginDto.remember ?? false,
        );
        this.eventEmitter?.emit?.(AUTH_EVENTS.TWO_FACTOR_CHALLENGED, { user });
        return { twoFactor: true, challengeToken };
      }
    }

    const tokens = await this.authService.generateTokens(user);
    this.eventEmitter?.emit?.(AUTH_EVENTS.LOGIN, { user });
    return { twoFactor: false, ...tokens };
  }

  @Post("logout")
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logout(@CurrentUser() user: AuthUser) {
    this.eventEmitter?.emit?.(AUTH_EVENTS.LOGOUT, { user });
    return { message: "Logged out successfully." };
  }
}
