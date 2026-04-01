export interface AuthUser {
  id: string;
  name: string;
  email: string;
  password: string;
  emailVerifiedAt: Date | null;
  twoFactorSecret: string | null;
  twoFactorRecoveryCodes: string | null;
  twoFactorConfirmedAt: Date | null;
  passwordConfirmedAt: Date | null;
}
