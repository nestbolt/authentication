import { Inject, Injectable, Optional } from "@nestjs/common";
import { UPDATES_USER_PROFILE } from "../authentication.constants";
import { AuthUser, UpdatesUserProfile } from "../interfaces";

@Injectable()
export class ProfileService {
  constructor(@Optional() @Inject(UPDATES_USER_PROFILE) private updater: UpdatesUserProfile) {}

  async update(user: AuthUser, data: Record<string, any>): Promise<void> {
    if (!this.updater) {
      throw new Error(
        `Missing provider: ${UPDATES_USER_PROFILE}. Register an implementation of UpdatesUserProfile.`,
      );
    }
    await this.updater.update(user, data);
  }
}
