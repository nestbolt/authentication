# Changelog

All notable changes to `@nestbolt/authentication` will be documented in this file.

## 0.1.1

### Bug Fixes

- **forRootAsync DI bypass** — `forRootAsync` was using `new options.userRepository()` which bypassed NestJS dependency injection, leaving repository dependencies (e.g. `DataSource`) undefined. Now uses `ModuleRef.create()` to properly instantiate repositories through the DI container.
- **forRootAsync missing PASSWORD_RESET_REPOSITORY** — The conditional `PASSWORD_RESET_REPOSITORY` registration present in `forRoot` was absent from `forRootAsync`. Now registers it via `ModuleRef.create()` when configured, or `null` when not (compatible with `@Optional()` injection).
- **TwoFactorController.enable() crash on empty body** — Calling `POST /user/two-factor-authentication` without a request body caused a `TypeError` because `@Body()` returned `undefined`. Now handles optional body with safe navigation (`body?.force ?? false`).

## 0.1.0

### Features

- **Initial release** — Frontend-agnostic authentication backend for NestJS
- **Registration** — User registration with customizable creation logic
- **Login/Logout** — JWT-based authentication with access and refresh tokens
- **Token Refresh** — Dedicated `POST /refresh` endpoint for renewing access tokens
- **Password Reset** — Forgot password and reset password flows with time-limited tokens
- **Email Verification** — HMAC-signed URL-based email verification with expiration
- **Profile Updates** — Update user profile information
- **Password Updates** — Change password for authenticated users
- **Password Confirmation** — Confirm password for sensitive actions with configurable timeout
- **Two-Factor Authentication** — TOTP-based 2FA with QR code generation and recovery codes
- **Recovery Codes** — 8 encrypted recovery codes per user for 2FA backup
- **Feature Flags** — Enable/disable features via module configuration
- **Database Agnostic** — Repository pattern supports any database (SQL, NoSQL, etc.)
- **Events** — 15 authentication events via @nestjs/event-emitter
- **Rate Limiting** — Configurable rate limiting for login, two-factor challenge, and email verification
- **Runtime Feature Gating** — `FeatureEnabledGuard` returns 404 for disabled features (enables `forRootAsync`)
- **AES-256-GCM Encryption** — 2FA secrets and recovery codes encrypted at rest
- **Timing-Safe Comparisons** — Recovery codes and email verification use constant-time comparison
- **Login Throttling** — IP + username keyed rate limiting with lockout events
- **Username Canonicalization** — Optional lowercase normalization on login

### Security

- Bcrypt password hashing
- AES-256-GCM encryption for 2FA secrets and recovery codes
- Timing-safe comparison for recovery codes and email verification signatures
- HMAC-SHA256 signed email verification URLs
- Short-lived (5 min) two-factor challenge tokens
- Configurable password confirmation timeout
- Rate limiting on login, two-factor challenge, and email verification endpoints
- Validated encryption input format with error handling
