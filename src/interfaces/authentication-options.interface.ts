import { Type } from "@nestjs/common";
import type { StringValue } from "ms";
import { PasswordResetRepository } from "./password-reset-repository.interface";
import { UserRepository } from "./user-repository.interface";

export enum Feature {
  REGISTRATION = "registration",
  RESET_PASSWORDS = "reset-passwords",
  EMAIL_VERIFICATION = "email-verification",
  UPDATE_PROFILE_INFORMATION = "update-profile-information",
  UPDATE_PASSWORDS = "update-passwords",
  TWO_FACTOR_AUTHENTICATION = "two-factor-authentication",
}

export interface TwoFactorOptions {
  confirm?: boolean;
  confirmPassword?: boolean;
  window?: number;
  secretLength?: number;
}

export interface AuthenticationModuleOptions {
  features: Feature[];
  twoFactorOptions?: TwoFactorOptions;

  userRepository: Type<UserRepository>;
  passwordResetRepository?: Type<PasswordResetRepository>;

  usernameField?: string;
  lowercaseUsernames?: boolean;

  jwtSecret: string;
  jwtExpiresIn?: StringValue;
  refreshSecret: string;
  refreshExpiresIn?: StringValue;

  loginRateLimit?: { ttl: number; limit: number };
  twoFactorRateLimit?: { ttl: number; limit: number };
  verificationRateLimit?: { ttl: number; limit: number };

  passwordTimeout?: number;

  routePrefix?: string;

  encryptionKey: string;

  appName?: string;
}

export interface AuthenticationAsyncOptions {
  imports?: any[];
  inject?: any[];
  useFactory: (
    ...args: any[]
  ) => Promise<AuthenticationModuleOptions> | AuthenticationModuleOptions;
}
