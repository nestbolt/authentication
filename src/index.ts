// Module
export { AuthenticationModule } from "./authentication.module";

// Constants
export {
  AUTHENTICATION_OPTIONS,
  USER_REPOSITORY,
  PASSWORD_RESET_REPOSITORY,
  CREATES_NEW_USERS,
  UPDATES_USER_PASSWORDS,
  UPDATES_USER_PROFILE,
  RESETS_USER_PASSWORDS,
} from "./authentication.constants";

// Interfaces
export type {
  AuthenticationModuleOptions,
  AuthenticationAsyncOptions,
  TwoFactorOptions,
} from "./interfaces";
export { Feature } from "./interfaces";
export type { AuthUser } from "./interfaces";
export type { UserRepository } from "./interfaces";
export type { PasswordResetRepository } from "./interfaces";
export type { CreatesNewUsers } from "./interfaces";
export type { UpdatesUserPasswords } from "./interfaces";
export type { UpdatesUserProfile } from "./interfaces";
export type { ResetsUserPasswords } from "./interfaces";

// Services
export { AuthService } from "./services";
export { EncryptionService } from "./services";
export { RecoveryCodeService } from "./services";
export { RegistrationService } from "./services";
export { PasswordResetService } from "./services";
export { EmailVerificationService } from "./services";
export { ProfileService } from "./services";
export { PasswordService } from "./services";
export { ConfirmPasswordService } from "./services";
export { TwoFactorService } from "./services";
export { TwoFactorProviderService } from "./services";

// Guards
export { JwtAuthGuard } from "./guards";
export { LocalAuthGuard } from "./guards";
export { GuestGuard } from "./guards";
export { FeatureEnabledGuard } from "./guards";
export { LoginThrottleGuard } from "./guards";
export { PasswordConfirmedGuard } from "./guards";

// Interceptors
export { CanonicalizeUsernameInterceptor } from "./interceptors";

// Strategies
export { LocalStrategy } from "./strategies";
export { JwtStrategy } from "./strategies";
export { JwtRefreshStrategy } from "./strategies";

// Decorators
export { CurrentUser } from "./decorators";
export { Public, IS_PUBLIC_KEY } from "./decorators";
export { RequiresFeature, REQUIRED_FEATURE_KEY } from "./decorators";

// Events
export { AUTH_EVENTS } from "./events";
export type { UserEvent, RecoveryCodeReplacedEvent, LockoutEvent } from "./events";

// DTOs
export { LoginDto } from "./dto";
export { RegisterDto } from "./dto";
export { ForgotPasswordDto } from "./dto";
export { ResetPasswordDto } from "./dto";
export { UpdatePasswordDto } from "./dto";
export { UpdateProfileDto } from "./dto";
export { ConfirmPasswordDto } from "./dto";
export { TwoFactorChallengeDto } from "./dto";
export { TwoFactorConfirmDto } from "./dto";
