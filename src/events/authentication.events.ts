import { AuthUser } from "../interfaces";

export const AUTH_EVENTS = {
  LOGIN: "auth.login",
  LOGOUT: "auth.logout",
  REGISTERED: "auth.registered",
  LOCKOUT: "auth.lockout",
  PASSWORD_RESET: "auth.password-reset",
  PASSWORD_UPDATED: "auth.password-updated",
  EMAIL_VERIFIED: "auth.email-verified",
  TWO_FACTOR_ENABLED: "auth.two-factor-enabled",
  TWO_FACTOR_DISABLED: "auth.two-factor-disabled",
  TWO_FACTOR_CONFIRMED: "auth.two-factor-confirmed",
  TWO_FACTOR_CHALLENGED: "auth.two-factor-challenged",
  TWO_FACTOR_FAILED: "auth.two-factor-failed",
  VALID_TWO_FACTOR_CODE: "auth.valid-two-factor-code",
  RECOVERY_CODE_REPLACED: "auth.recovery-code-replaced",
  RECOVERY_CODES_GENERATED: "auth.recovery-codes-generated",
} as const;

export interface UserEvent {
  user: AuthUser;
}

export interface RecoveryCodeReplacedEvent extends UserEvent {
  code: string;
}

export interface LockoutEvent {
  request: Record<string, unknown>;
}
