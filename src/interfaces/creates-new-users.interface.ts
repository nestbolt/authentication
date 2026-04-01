import { AuthUser } from "./user.interface";

export interface CreatesNewUsers {
  create(data: Record<string, any>): Promise<AuthUser>;
}
