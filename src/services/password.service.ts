import { Inject, Injectable, Optional } from "@nestjs/common";
import { UPDATES_USER_PASSWORDS } from "../authentication.constants";
import { AUTH_EVENTS } from "../events";
import { AuthUser, EventEmitterLike, UpdatesUserPasswords } from "../interfaces";

@Injectable()
export class PasswordService {
  constructor(
    @Inject(UPDATES_USER_PASSWORDS) private updater: UpdatesUserPasswords,
    @Optional() @Inject("EventEmitter2") private eventEmitter?: EventEmitterLike,
  ) {}

  async update(user: AuthUser, data: Record<string, any>): Promise<void> {
    await this.updater.update(user, data);
    this.eventEmitter?.emit?.(AUTH_EVENTS.PASSWORD_UPDATED, { user });
  }
}
