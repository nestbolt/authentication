import { Injectable, Inject, Optional } from "@nestjs/common";
import { UPDATES_USER_PASSWORDS } from "../authentication.constants";
import { UpdatesUserPasswords, AuthUser } from "../interfaces";
import { AUTH_EVENTS } from "../events";

@Injectable()
export class PasswordService {
  constructor(
    @Inject(UPDATES_USER_PASSWORDS) private updater: UpdatesUserPasswords,
    @Optional() @Inject("EventEmitter2") private eventEmitter?: any,
  ) {}

  async update(user: AuthUser, data: Record<string, any>): Promise<void> {
    await this.updater.update(user, data);
    this.eventEmitter?.emit?.(AUTH_EVENTS.PASSWORD_UPDATED, { user });
  }
}
