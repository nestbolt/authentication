import { Inject, Injectable, Optional } from "@nestjs/common";
import { CREATES_NEW_USERS } from "../authentication.constants";
import { AUTH_EVENTS } from "../events";
import { AuthUser, CreatesNewUsers, EventEmitterLike } from "../interfaces";
import { AuthService } from "./auth.service";

@Injectable()
export class RegistrationService {
  constructor(
    @Inject(CREATES_NEW_USERS) private creator: CreatesNewUsers,
    private authService: AuthService,
    @Optional() @Inject("EventEmitter2") private eventEmitter?: EventEmitterLike,
  ) {}

  async register(
    data: Record<string, any>,
  ): Promise<{ user: AuthUser; accessToken: string; refreshToken: string }> {
    const user = await this.creator.create(data);
    this.eventEmitter?.emit?.(AUTH_EVENTS.REGISTERED, { user });
    const tokens = await this.authService.generateTokens(user);
    return { user, ...tokens };
  }
}
