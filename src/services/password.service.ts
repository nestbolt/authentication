import { Inject, Injectable, Optional } from "@nestjs/common";
import { UPDATES_USER_PASSWORDS } from "../authentication.constants";
import { AUTH_EVENTS } from "../events";
import { AuthUser, EventEmitterLike, UpdatesUserPasswords } from "../interfaces";

@Injectable()
export class PasswordService {
  constructor(
    @Optional() @Inject(UPDATES_USER_PASSWORDS) private updater: UpdatesUserPasswords,
    @Optional() @Inject("EventEmitter2") private eventEmitter?: EventEmitterLike,
  ) {}

  async update(user: AuthUser, data: Record<string, any>): Promise<void> {
    if (!this.updater) {
      throw new Error(
        `Missing provider: ${UPDATES_USER_PASSWORDS}. Register an implementation of UpdatesUserPasswords.`,
      );
    }
    await this.updater.update(user, data);
    this.eventEmitter?.emit?.(AUTH_EVENTS.PASSWORD_UPDATED, { user });
  }
}
