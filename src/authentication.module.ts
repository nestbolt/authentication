import { DynamicModule, Module, Provider, Type } from "@nestjs/common";
import { ModuleRef } from "@nestjs/core";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import {
  AUTHENTICATION_OPTIONS,
  PASSWORD_RESET_REPOSITORY,
  USER_REPOSITORY,
} from "./authentication.constants";
import { AuthenticationAsyncOptions, AuthenticationModuleOptions, Feature } from "./interfaces";

import { AuthController } from "./controllers/auth.controller";
import { ConfirmPasswordController } from "./controllers/confirm-password.controller";
import { EmailVerificationController } from "./controllers/email-verification.controller";
import { PasswordResetController } from "./controllers/password-reset.controller";
import { PasswordController } from "./controllers/password.controller";
import { ProfileController } from "./controllers/profile.controller";
import { RegistrationController } from "./controllers/registration.controller";
import { TwoFactorChallengeController } from "./controllers/two-factor-challenge.controller";
import { TwoFactorController } from "./controllers/two-factor.controller";

import { AuthService } from "./services/auth.service";
import { ConfirmPasswordService } from "./services/confirm-password.service";
import { EmailVerificationService } from "./services/email-verification.service";
import { EncryptionService } from "./services/encryption.service";
import { PasswordResetService } from "./services/password-reset.service";
import { PasswordService } from "./services/password.service";
import { ProfileService } from "./services/profile.service";
import { RecoveryCodeService } from "./services/recovery-code.service";
import { RegistrationService } from "./services/registration.service";
import { TwoFactorProviderService } from "./services/two-factor-provider.service";
import { TwoFactorService } from "./services/two-factor.service";

import { JwtRefreshStrategy } from "./strategies/jwt-refresh.strategy";
import { JwtStrategy } from "./strategies/jwt.strategy";
import { LocalStrategy } from "./strategies/local.strategy";

import { FeatureEnabledGuard } from "./guards/feature-enabled.guard";
import { GuestGuard } from "./guards/guest.guard";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { LoginThrottleGuard } from "./guards/login-throttle.guard";
import { PasswordConfirmedGuard } from "./guards/password-confirmed.guard";
import { TwoFactorThrottleGuard } from "./guards/two-factor-throttle.guard";
import { VerificationThrottleGuard } from "./guards/verification-throttle.guard";

import { CanonicalizeUsernameInterceptor } from "./interceptors/canonicalize-username.interceptor";

@Module({})
export class AuthenticationModule {
  static forRoot(options: AuthenticationModuleOptions): DynamicModule {
    const controllers: Type[] = [AuthController, ConfirmPasswordController];

    if (options.features.includes(Feature.REGISTRATION)) {
      controllers.push(RegistrationController);
    }
    if (options.features.includes(Feature.RESET_PASSWORDS)) {
      controllers.push(PasswordResetController);
    }
    if (options.features.includes(Feature.EMAIL_VERIFICATION)) {
      controllers.push(EmailVerificationController);
    }
    if (options.features.includes(Feature.UPDATE_PROFILE_INFORMATION)) {
      controllers.push(ProfileController);
    }
    if (options.features.includes(Feature.UPDATE_PASSWORDS)) {
      controllers.push(PasswordController);
    }
    if (options.features.includes(Feature.TWO_FACTOR_AUTHENTICATION)) {
      controllers.push(TwoFactorController);
      controllers.push(TwoFactorChallengeController);
    }

    const providers: Provider[] = [
      { provide: AUTHENTICATION_OPTIONS, useValue: options },
      { provide: USER_REPOSITORY, useClass: options.userRepository },
      // Core services
      AuthService,
      EncryptionService,
      RecoveryCodeService,
      ConfirmPasswordService,
      // Passport strategies
      LocalStrategy,
      JwtStrategy,
      JwtRefreshStrategy,
      // Guards
      JwtAuthGuard,
      LoginThrottleGuard,
      TwoFactorThrottleGuard,
      VerificationThrottleGuard,
      FeatureEnabledGuard,
      PasswordConfirmedGuard,
      GuestGuard,
      // Interceptors
      CanonicalizeUsernameInterceptor,
    ];

    if (options.passwordResetRepository) {
      providers.push({
        provide: PASSWORD_RESET_REPOSITORY,
        useClass: options.passwordResetRepository,
      });
    }

    if (options.features.includes(Feature.REGISTRATION)) {
      providers.push(RegistrationService);
    }
    if (options.features.includes(Feature.RESET_PASSWORDS)) {
      providers.push(PasswordResetService);
    }
    if (options.features.includes(Feature.EMAIL_VERIFICATION)) {
      providers.push(EmailVerificationService);
    }
    if (options.features.includes(Feature.UPDATE_PROFILE_INFORMATION)) {
      providers.push(ProfileService);
    }
    if (options.features.includes(Feature.UPDATE_PASSWORDS)) {
      providers.push(PasswordService);
    }
    if (options.features.includes(Feature.TWO_FACTOR_AUTHENTICATION)) {
      providers.push(TwoFactorService);
      providers.push(TwoFactorProviderService);
    }

    return {
      module: AuthenticationModule,
      global: true,
      imports: [
        PassportModule.register({ defaultStrategy: "jwt" }),
        JwtModule.register({
          secret: options.jwtSecret,
          signOptions: { expiresIn: options.jwtExpiresIn ?? "15m" },
        }),
      ],
      controllers,
      providers,
      exports: [
        AuthService,
        EncryptionService,
        RecoveryCodeService,
        ConfirmPasswordService,
        AUTHENTICATION_OPTIONS,
        USER_REPOSITORY,
        ...(options.features.includes(Feature.REGISTRATION) ? [RegistrationService] : []),
        ...(options.features.includes(Feature.RESET_PASSWORDS) ? [PasswordResetService] : []),
        ...(options.features.includes(Feature.EMAIL_VERIFICATION)
          ? [EmailVerificationService]
          : []),
        ...(options.features.includes(Feature.UPDATE_PROFILE_INFORMATION) ? [ProfileService] : []),
        ...(options.features.includes(Feature.UPDATE_PASSWORDS) ? [PasswordService] : []),
        ...(options.features.includes(Feature.TWO_FACTOR_AUTHENTICATION)
          ? [TwoFactorService, TwoFactorProviderService]
          : []),
      ],
    };
  }

  static forRootAsync(asyncOptions: AuthenticationAsyncOptions): DynamicModule {
    const optionsProvider: Provider = {
      provide: AUTHENTICATION_OPTIONS,
      useFactory: asyncOptions.useFactory,
      inject: asyncOptions.inject ?? [],
    };

    const repositoryProviders: Provider[] = [
      {
        provide: USER_REPOSITORY,
        useFactory: async (options: AuthenticationModuleOptions, moduleRef: ModuleRef) =>
          moduleRef.create(options.userRepository),
        inject: [AUTHENTICATION_OPTIONS, ModuleRef],
      },
      {
        provide: PASSWORD_RESET_REPOSITORY,
        useFactory: async (options: AuthenticationModuleOptions, moduleRef: ModuleRef) =>
          options.passwordResetRepository
            ? moduleRef.create(options.passwordResetRepository)
            : null,
        inject: [AUTHENTICATION_OPTIONS, ModuleRef],
      },
    ];

    // With async options, controllers/services are registered eagerly since
    // the features array is not available at static definition time.
    // The FeatureEnabledGuard on each controller gates access at runtime.
    return {
      module: AuthenticationModule,
      global: true,
      imports: [
        ...(asyncOptions.imports ?? []),
        PassportModule.register({ defaultStrategy: "jwt" }),
        JwtModule.registerAsync({
          imports: asyncOptions.imports,
          inject: asyncOptions.inject,
          useFactory: async (...args: any[]) => {
            const options = await asyncOptions.useFactory(...args);
            return {
              secret: options.jwtSecret,
              signOptions: { expiresIn: options.jwtExpiresIn ?? "15m" },
            };
          },
        }),
      ],
      controllers: [
        AuthController,
        ConfirmPasswordController,
        RegistrationController,
        PasswordResetController,
        EmailVerificationController,
        ProfileController,
        PasswordController,
        TwoFactorController,
        TwoFactorChallengeController,
      ],
      providers: [
        optionsProvider,
        ...repositoryProviders,
        // Core services
        AuthService,
        EncryptionService,
        RecoveryCodeService,
        ConfirmPasswordService,
        // Passport strategies
        LocalStrategy,
        JwtStrategy,
        JwtRefreshStrategy,
        // Guards
        JwtAuthGuard,
        LoginThrottleGuard,
        TwoFactorThrottleGuard,
        VerificationThrottleGuard,
        FeatureEnabledGuard,
        PasswordConfirmedGuard,
        GuestGuard,
        // Interceptors
        CanonicalizeUsernameInterceptor,
        // Feature services (gated at runtime by FeatureEnabledGuard)
        RegistrationService,
        PasswordResetService,
        EmailVerificationService,
        ProfileService,
        PasswordService,
        TwoFactorService,
        TwoFactorProviderService,
      ],
      exports: [
        AuthService,
        EncryptionService,
        RecoveryCodeService,
        ConfirmPasswordService,
        RegistrationService,
        PasswordResetService,
        EmailVerificationService,
        ProfileService,
        PasswordService,
        TwoFactorService,
        TwoFactorProviderService,
        AUTHENTICATION_OPTIONS,
        USER_REPOSITORY,
      ],
    };
  }
}
