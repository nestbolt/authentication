import { AuthUser } from "./user.interface";

export interface ResetsUserPasswords {
  reset(user: AuthUser, password: string): Promise<void>;
}
