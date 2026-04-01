import { AuthUser } from "./user.interface";

export interface UserRepository {
  findById(id: string): Promise<AuthUser | null>;
  findByField(field: string, value: string): Promise<AuthUser | null>;
  save(user: Partial<AuthUser> & { id: string }): Promise<AuthUser>;
  create(data: Omit<AuthUser, "id">): Promise<AuthUser>;
}
