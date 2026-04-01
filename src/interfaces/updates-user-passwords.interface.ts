import { AuthUser } from "./user.interface";

export interface UpdatesUserPasswords {
  update(user: AuthUser, data: Record<string, any>): Promise<void>;
}
