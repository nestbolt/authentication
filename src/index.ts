// Module
export { AuthenticationModule } from "./authentication.module";

// Constants
export {
  AUTHENTICATION_OPTIONS,
  CREATES_NEW_USERS,
  PASSWORD_RESET_REPOSITORY,
  RESETS_USER_PASSWORDS,
  UPDATES_USER_PASSWORDS,
  UPDATES_USER_PROFILE,
  USER_REPOSITORY,
} from "./authentication.constants";

// Interfaces
export { Feature } from "./interfaces";
export type {
  AuthenticationAsyncOptions,
  AuthenticationModuleOptions,
  AuthUser,
  CreatesNewUsers,
  EventEmitterLike,
  PasswordResetRepository,
  ResetsUserPasswords,
  TwoFactorOptions,
  UpdatesUserPasswords,
  UpdatesUserProfile,
  UserRepository,
} from "./interfaces";

// Services
export {
  AuthService,
  ConfirmPasswordService,
  EmailVerificationService,
  EncryptionService,
  PasswordResetService,
  PasswordService,
  ProfileService,
  RecoveryCodeService,
  RegistrationService,
  TwoFactorProviderService,
  TwoFactorService,
} from "./services";

// Guards
export {
  FeatureEnabledGuard,
  GuestGuard,
  JwtAuthGuard,
  LocalAuthGuard,
  LoginThrottleGuard,
  PasswordConfirmedGuard,
} from "./guards";

// Interceptors
export { CanonicalizeUsernameInterceptor } from "./interceptors";

// Strategies
export { JwtRefreshStrategy, JwtStrategy, LocalStrategy } from "./strategies";

// Decorators
export {
  CurrentUser,
  IS_PUBLIC_KEY,
  Public,
  REQUIRED_FEATURE_KEY,
  RequiresFeature,
} from "./decorators";

// Events
export { AUTH_EVENTS } from "./events";
export type { LockoutEvent, RecoveryCodeReplacedEvent, UserEvent } from "./events";

// DTOs
export {
  ConfirmPasswordDto,
  ForgotPasswordDto,
  LoginDto,
  RegisterDto,
  ResetPasswordDto,
  TwoFactorChallengeDto,
  TwoFactorConfirmDto,
  UpdatePasswordDto,
  UpdateProfileDto,
} from "./dto";
