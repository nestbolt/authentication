import { Inject, Injectable } from "@nestjs/common";
import { UPDATES_USER_PROFILE } from "../authentication.constants";
import { AuthUser, UpdatesUserProfile } from "../interfaces";

@Injectable()
export class ProfileService {
  constructor(@Inject(UPDATES_USER_PROFILE) private updater: UpdatesUserProfile) {}

  async update(user: AuthUser, data: Record<string, any>): Promise<void> {
    await this.updater.update(user, data);
  }
}
