import { AuthUser } from "./user.interface";

export interface UpdatesUserProfile {
  update(user: AuthUser, data: Record<string, any>): Promise<void>;
}
