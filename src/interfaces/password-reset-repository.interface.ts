export interface PasswordResetRepository {
  createToken(email: string, hashedToken: string): Promise<void>;
  findByEmail(email: string): Promise<{ token: string; createdAt: Date } | null>;
  deleteByEmail(email: string): Promise<void>;
}
