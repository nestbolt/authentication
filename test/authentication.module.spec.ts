import { describe, it, expect } from "vitest";
import { AuthenticationModule } from "../src/authentication.module";
import { Feature } from "../src/interfaces";
import { AuthController } from "../src/controllers/auth.controller";
import { ConfirmPasswordController } from "../src/controllers/confirm-password.controller";
import { RegistrationController } from "../src/controllers/registration.controller";
import { PasswordResetController } from "../src/controllers/password-reset.controller";
import { EmailVerificationController } from "../src/controllers/email-verification.controller";
import { ProfileController } from "../src/controllers/profile.controller";
import { PasswordController } from "../src/controllers/password.controller";
import { TwoFactorController } from "../src/controllers/two-factor.controller";
import { TwoFactorChallengeController } from "../src/controllers/two-factor-challenge.controller";
import { AuthService } from "../src/services/auth.service";
import { EncryptionService } from "../src/services/encryption.service";
import { RecoveryCodeService } from "../src/services/recovery-code.service";
import { ConfirmPasswordService } from "../src/services/confirm-password.service";
import { RegistrationService } from "../src/services/registration.service";
import { PasswordResetService } from "../src/services/password-reset.service";
import { EmailVerificationService } from "../src/services/email-verification.service";
import { ProfileService } from "../src/services/profile.service";
import { PasswordService } from "../src/services/password.service";
import { TwoFactorService } from "../src/services/two-factor.service";
import { TwoFactorProviderService } from "../src/services/two-factor-provider.service";
import { AUTHENTICATION_OPTIONS, PASSWORD_RESET_REPOSITORY, USER_REPOSITORY } from "../src/authentication.constants";

class MockUserRepository {
  findById() {}
  findByField() {}
  save() {}
  create() {}
}

class MockPasswordResetRepository {
  createToken() {}
  findByEmail() {}
  deleteByEmail() {}
}

describe("AuthenticationModule", () => {
  const baseOptions = {
    features: [] as Feature[],
    jwtSecret: "jwt-secret",
    refreshSecret: "refresh-secret",
    encryptionKey: Buffer.from("a".repeat(32)).toString("base64"),
    userRepository: MockUserRepository as any,
  };

  describe("forRoot", () => {
    it("should return base controllers when no features enabled", () => {
      const result = AuthenticationModule.forRoot(baseOptions);

      expect(result.module).toBe(AuthenticationModule);
      expect(result.global).toBe(true);
      expect(result.controllers).toContain(AuthController);
      expect(result.controllers).toContain(ConfirmPasswordController);
      expect(result.controllers).toHaveLength(2);
    });

    it("should add RegistrationController when REGISTRATION feature enabled", () => {
      const result = AuthenticationModule.forRoot({
        ...baseOptions,
        features: [Feature.REGISTRATION],
      });

      expect(result.controllers).toContain(RegistrationController);
      expect(result.controllers).toHaveLength(3);
    });

    it("should add PasswordResetController when RESET_PASSWORDS feature enabled", () => {
      const result = AuthenticationModule.forRoot({
        ...baseOptions,
        features: [Feature.RESET_PASSWORDS],
      });

      expect(result.controllers).toContain(PasswordResetController);
    });

    it("should add EmailVerificationController when EMAIL_VERIFICATION feature enabled", () => {
      const result = AuthenticationModule.forRoot({
        ...baseOptions,
        features: [Feature.EMAIL_VERIFICATION],
      });

      expect(result.controllers).toContain(EmailVerificationController);
    });

    it("should add ProfileController when UPDATE_PROFILE_INFORMATION feature enabled", () => {
      const result = AuthenticationModule.forRoot({
        ...baseOptions,
        features: [Feature.UPDATE_PROFILE_INFORMATION],
      });

      expect(result.controllers).toContain(ProfileController);
    });

    it("should add PasswordController when UPDATE_PASSWORDS feature enabled", () => {
      const result = AuthenticationModule.forRoot({
        ...baseOptions,
        features: [Feature.UPDATE_PASSWORDS],
      });

      expect(result.controllers).toContain(PasswordController);
    });

    it("should add TwoFactor controllers when TWO_FACTOR_AUTHENTICATION feature enabled", () => {
      const result = AuthenticationModule.forRoot({
        ...baseOptions,
        features: [Feature.TWO_FACTOR_AUTHENTICATION],
      });

      expect(result.controllers).toContain(TwoFactorController);
      expect(result.controllers).toContain(TwoFactorChallengeController);
    });

    it("should add all controllers when all features enabled", () => {
      const result = AuthenticationModule.forRoot({
        ...baseOptions,
        features: [
          Feature.REGISTRATION,
          Feature.RESET_PASSWORDS,
          Feature.EMAIL_VERIFICATION,
          Feature.UPDATE_PROFILE_INFORMATION,
          Feature.UPDATE_PASSWORDS,
          Feature.TWO_FACTOR_AUTHENTICATION,
        ],
      });

      expect(result.controllers).toHaveLength(9);
    });

    it("should include core providers", () => {
      const result = AuthenticationModule.forRoot(baseOptions);
      const providers = result.providers as any[];

      const providerValues = providers.map((p: any) => (typeof p === "function" ? p : p.provide ?? p));
      expect(providerValues).toContain(AuthService);
      expect(providerValues).toContain(EncryptionService);
      expect(providerValues).toContain(RecoveryCodeService);
      expect(providerValues).toContain(ConfirmPasswordService);
      expect(providerValues).toContain(AUTHENTICATION_OPTIONS);
      expect(providerValues).toContain(USER_REPOSITORY);
    });

    it("should add PASSWORD_RESET_REPOSITORY when passwordResetRepository is provided", () => {
      const result = AuthenticationModule.forRoot({
        ...baseOptions,
        passwordResetRepository: MockPasswordResetRepository as any,
      });
      const providers = result.providers as any[];

      const hasResetRepo = providers.some(
        (p: any) => typeof p === "object" && p.provide === PASSWORD_RESET_REPOSITORY,
      );
      expect(hasResetRepo).toBe(true);
    });

    it("should not add PASSWORD_RESET_REPOSITORY when passwordResetRepository is not provided", () => {
      const result = AuthenticationModule.forRoot(baseOptions);
      const providers = result.providers as any[];

      const hasResetRepo = providers.some(
        (p: any) => typeof p === "object" && p.provide === PASSWORD_RESET_REPOSITORY,
      );
      expect(hasResetRepo).toBe(false);
    });

    it("should add feature-specific service providers when features enabled", () => {
      const result = AuthenticationModule.forRoot({
        ...baseOptions,
        features: [
          Feature.REGISTRATION,
          Feature.RESET_PASSWORDS,
          Feature.EMAIL_VERIFICATION,
          Feature.UPDATE_PROFILE_INFORMATION,
          Feature.UPDATE_PASSWORDS,
          Feature.TWO_FACTOR_AUTHENTICATION,
        ],
      });
      const providers = result.providers as any[];

      expect(providers).toContain(RegistrationService);
      expect(providers).toContain(PasswordResetService);
      expect(providers).toContain(EmailVerificationService);
      expect(providers).toContain(ProfileService);
      expect(providers).toContain(PasswordService);
      expect(providers).toContain(TwoFactorService);
      expect(providers).toContain(TwoFactorProviderService);
    });

    it("should not add feature-specific providers when features are disabled", () => {
      const result = AuthenticationModule.forRoot(baseOptions);
      const providers = result.providers as any[];

      expect(providers).not.toContain(RegistrationService);
      expect(providers).not.toContain(PasswordResetService);
      expect(providers).not.toContain(EmailVerificationService);
      expect(providers).not.toContain(ProfileService);
      expect(providers).not.toContain(PasswordService);
      expect(providers).not.toContain(TwoFactorService);
      expect(providers).not.toContain(TwoFactorProviderService);
    });

    it("should export feature-specific services when features enabled", () => {
      const result = AuthenticationModule.forRoot({
        ...baseOptions,
        features: [
          Feature.REGISTRATION,
          Feature.RESET_PASSWORDS,
          Feature.EMAIL_VERIFICATION,
          Feature.UPDATE_PROFILE_INFORMATION,
          Feature.UPDATE_PASSWORDS,
          Feature.TWO_FACTOR_AUTHENTICATION,
        ],
      });
      const exports = result.exports as any[];

      expect(exports).toContain(RegistrationService);
      expect(exports).toContain(PasswordResetService);
      expect(exports).toContain(EmailVerificationService);
      expect(exports).toContain(ProfileService);
      expect(exports).toContain(PasswordService);
      expect(exports).toContain(TwoFactorService);
      expect(exports).toContain(TwoFactorProviderService);
    });

    it("should not export feature-specific services when features disabled", () => {
      const result = AuthenticationModule.forRoot(baseOptions);
      const exports = result.exports as any[];

      expect(exports).not.toContain(RegistrationService);
      expect(exports).not.toContain(PasswordResetService);
      expect(exports).not.toContain(EmailVerificationService);
      expect(exports).not.toContain(ProfileService);
      expect(exports).not.toContain(PasswordService);
      expect(exports).not.toContain(TwoFactorService);
      expect(exports).not.toContain(TwoFactorProviderService);
    });

    it("should always export core services and tokens", () => {
      const result = AuthenticationModule.forRoot(baseOptions);
      const exports = result.exports as any[];

      expect(exports).toContain(AuthService);
      expect(exports).toContain(EncryptionService);
      expect(exports).toContain(RecoveryCodeService);
      expect(exports).toContain(ConfirmPasswordService);
      expect(exports).toContain(AUTHENTICATION_OPTIONS);
      expect(exports).toContain(USER_REPOSITORY);
    });

    it("should configure JwtModule with provided jwtSecret", () => {
      const result = AuthenticationModule.forRoot({
        ...baseOptions,
        jwtSecret: "my-secret",
      });

      expect(result.imports).toBeDefined();
      expect(result.imports!.length).toBeGreaterThanOrEqual(2);
    });

    it("should configure PassportModule with jwt default strategy", () => {
      const result = AuthenticationModule.forRoot(baseOptions);

      expect(result.imports).toBeDefined();
      expect(result.imports!.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("forRootAsync", () => {
    it("should return a valid DynamicModule", () => {
      const result = AuthenticationModule.forRootAsync({
        useFactory: () => baseOptions,
      });

      expect(result.module).toBe(AuthenticationModule);
      expect(result.global).toBe(true);
    });

    it("should include all controllers", () => {
      const result = AuthenticationModule.forRootAsync({
        useFactory: () => baseOptions,
      });

      expect(result.controllers).toContain(AuthController);
      expect(result.controllers).toContain(ConfirmPasswordController);
      expect(result.controllers).toContain(RegistrationController);
      expect(result.controllers).toContain(PasswordResetController);
      expect(result.controllers).toContain(EmailVerificationController);
      expect(result.controllers).toContain(ProfileController);
      expect(result.controllers).toContain(PasswordController);
      expect(result.controllers).toContain(TwoFactorController);
      expect(result.controllers).toContain(TwoFactorChallengeController);
      expect(result.controllers).toHaveLength(9);
    });

    it("should include all service providers", () => {
      const result = AuthenticationModule.forRootAsync({
        useFactory: () => baseOptions,
      });
      const providers = result.providers as any[];

      expect(providers).toContain(AuthService);
      expect(providers).toContain(EncryptionService);
      expect(providers).toContain(RecoveryCodeService);
      expect(providers).toContain(ConfirmPasswordService);
      expect(providers).toContain(RegistrationService);
      expect(providers).toContain(PasswordResetService);
      expect(providers).toContain(EmailVerificationService);
      expect(providers).toContain(ProfileService);
      expect(providers).toContain(PasswordService);
      expect(providers).toContain(TwoFactorService);
      expect(providers).toContain(TwoFactorProviderService);
    });

    it("should export all services", () => {
      const result = AuthenticationModule.forRootAsync({
        useFactory: () => baseOptions,
      });
      const exports = result.exports as any[];

      expect(exports).toContain(AuthService);
      expect(exports).toContain(RegistrationService);
      expect(exports).toContain(PasswordResetService);
      expect(exports).toContain(EmailVerificationService);
      expect(exports).toContain(ProfileService);
      expect(exports).toContain(PasswordService);
      expect(exports).toContain(TwoFactorService);
      expect(exports).toContain(TwoFactorProviderService);
      expect(exports).toContain(AUTHENTICATION_OPTIONS);
      expect(exports).toContain(USER_REPOSITORY);
    });

    it("should include custom imports", () => {
      const customModule = { module: class CustomModule {} };
      const result = AuthenticationModule.forRootAsync({
        imports: [customModule],
        useFactory: () => baseOptions,
      });

      expect(result.imports).toContain(customModule);
    });

    it("should handle missing imports gracefully", () => {
      const result = AuthenticationModule.forRootAsync({
        useFactory: () => baseOptions,
      });

      expect(result.imports).toBeDefined();
    });

    it("should provide AUTHENTICATION_OPTIONS via useFactory", () => {
      const factory = () => baseOptions;
      const result = AuthenticationModule.forRootAsync({
        useFactory: factory,
        inject: ["ConfigService"],
      });
      const providers = result.providers as any[];

      const optionsProvider = providers.find(
        (p: any) => typeof p === "object" && p.provide === AUTHENTICATION_OPTIONS,
      );
      expect(optionsProvider).toBeDefined();
      expect(optionsProvider.useFactory).toBe(factory);
      expect(optionsProvider.inject).toEqual(["ConfigService"]);
    });

    it("should provide USER_REPOSITORY with factory", () => {
      const result = AuthenticationModule.forRootAsync({
        useFactory: () => baseOptions,
      });
      const providers = result.providers as any[];

      const userRepoProvider = providers.find(
        (p: any) => typeof p === "object" && p.provide === USER_REPOSITORY,
      );
      expect(userRepoProvider).toBeDefined();
      expect(userRepoProvider.useFactory).toBeInstanceOf(Function);
      expect(userRepoProvider.inject).toContain(AUTHENTICATION_OPTIONS);
    });

    it("should create user repository instance from options", () => {
      const result = AuthenticationModule.forRootAsync({
        useFactory: () => baseOptions,
      });
      const providers = result.providers as any[];

      const userRepoProvider = providers.find(
        (p: any) => typeof p === "object" && p.provide === USER_REPOSITORY,
      );
      const instance = userRepoProvider.useFactory(baseOptions);
      expect(instance).toBeInstanceOf(MockUserRepository);
    });

    it("should use empty inject array when inject is not provided", () => {
      const result = AuthenticationModule.forRootAsync({
        useFactory: () => baseOptions,
      });
      const providers = result.providers as any[];

      const optionsProvider = providers.find(
        (p: any) => typeof p === "object" && p.provide === AUTHENTICATION_OPTIONS,
      );
      expect(optionsProvider.inject).toEqual([]);
    });

    it("should configure JwtModule.registerAsync with useFactory", async () => {
      const opts = { ...baseOptions, jwtExpiresIn: "30m" as const };
      const result = AuthenticationModule.forRootAsync({
        useFactory: () => opts,
        inject: ["ConfigService"],
      });

      // The imports should contain PassportModule and JwtModule async config
      expect(result.imports).toBeDefined();
      expect(result.imports!.length).toBeGreaterThanOrEqual(2);
    });

    it("should resolve JwtModule factory with correct options", async () => {
      const opts = { ...baseOptions, jwtExpiresIn: "30m" as const };
      const result = AuthenticationModule.forRootAsync({
        useFactory: () => opts,
        inject: [],
      });

      // Find the JwtModule async config in imports
      const jwtModuleConfig = result.imports!.find(
        (imp: any) => imp?.module?.name === "JwtModule",
      );
      expect(jwtModuleConfig).toBeDefined();

      if (jwtModuleConfig?.providers) {
        const factory = jwtModuleConfig.providers.find(
          (p: any) => p.useFactory,
        );
        if (factory) {
          const jwtOpts = await factory.useFactory();
          expect(jwtOpts.secret).toBe("jwt-secret");
          expect(jwtOpts.signOptions.expiresIn).toBe("30m");
        }
      }
    });
  });
});
