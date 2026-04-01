import {
  Controller,
  Post,
  Body,
  Req,
  HttpCode,
  HttpStatus,
  UseGuards,
  UseInterceptors,
  Inject,
  Optional,
} from "@nestjs/common";
import { Public } from "../decorators";
import { LocalAuthGuard } from "../guards/local-auth.guard";
import { JwtAuthGuard } from "../guards/jwt-auth.guard";
import { LoginThrottleGuard } from "../guards/login-throttle.guard";
import { CanonicalizeUsernameInterceptor } from "../interceptors/canonicalize-username.interceptor";
import { AuthService } from "../services/auth.service";
import { LoginDto } from "../dto/login.dto";
import { CurrentUser } from "../decorators";
import { AUTHENTICATION_OPTIONS } from "../authentication.constants";
import { AuthenticationModuleOptions, Feature, AuthUser } from "../interfaces";
import { AUTH_EVENTS } from "../events";

@Controller()
export class AuthController {
  constructor(
    private authService: AuthService,
    @Inject(AUTHENTICATION_OPTIONS) private options: AuthenticationModuleOptions,
    @Optional() @Inject("EventEmitter2") private eventEmitter?: any,
  ) {}

  @Post("login")
  @Public()
  @UseGuards(LoginThrottleGuard, LocalAuthGuard)
  @UseInterceptors(CanonicalizeUsernameInterceptor)
  @HttpCode(HttpStatus.OK)
  async login(@Body() _loginDto: LoginDto, @Req() request: any) {
    const user = request.user as AuthUser;

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
