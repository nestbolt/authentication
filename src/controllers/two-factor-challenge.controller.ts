import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Inject,
  Optional,
  Post,
  Req,
  UnprocessableEntityException,
  UseGuards,
} from "@nestjs/common";
import { Public, RequiresFeature } from "../decorators";
import { TwoFactorChallengeDto } from "../dto/two-factor-challenge.dto";
import { AUTH_EVENTS } from "../events";
import { TwoFactorThrottleGuard } from "../guards/two-factor-throttle.guard";
import { EventEmitterLike, Feature } from "../interfaces";
import { AuthService } from "../services/auth.service";
import { TwoFactorService } from "../services/two-factor.service";

@Controller()
@RequiresFeature(Feature.TWO_FACTOR_AUTHENTICATION)
export class TwoFactorChallengeController {
  constructor(
    private authService: AuthService,
    private twoFactorService: TwoFactorService,
    private throttleGuard: TwoFactorThrottleGuard,
    @Optional() @Inject("EventEmitter2") private eventEmitter?: EventEmitterLike,
  ) {}

  @Post("two-factor-challenge")
  @Public()
  @UseGuards(TwoFactorThrottleGuard)
  @HttpCode(HttpStatus.OK)
  async challenge(
    @Body() dto: TwoFactorChallengeDto,
    @Req() request: { body: Record<string, unknown>; ip?: string },
  ) {
    const { challengeToken, code, recoveryCode } = dto;

    const { user } = await this.authService.getChallengedUser(challengeToken);

    if (recoveryCode) {
      const valid = await this.twoFactorService.validateRecoveryCode(user, recoveryCode);
      if (!valid) {
        this.throttleGuard.increment(request);
        this.eventEmitter?.emit?.(AUTH_EVENTS.TWO_FACTOR_FAILED, { user });
        throw new UnprocessableEntityException("The provided recovery code was invalid.");
      }
    } else if (code) {
      const valid = await this.twoFactorService.validateCode(user, code);
      if (!valid) {
        this.throttleGuard.increment(request);
        this.eventEmitter?.emit?.(AUTH_EVENTS.TWO_FACTOR_FAILED, { user });
        throw new UnprocessableEntityException("The provided two-factor code was invalid.");
      }
    } else {
      throw new BadRequestException("A code or recovery_code is required.");
    }

    this.throttleGuard.clear(request);
    this.eventEmitter?.emit?.(AUTH_EVENTS.VALID_TWO_FACTOR_CODE, { user });
    const tokens = await this.authService.generateTokens(user);
    return { twoFactor: false, ...tokens };
  }
}
