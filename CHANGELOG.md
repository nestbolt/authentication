# Changelog

All notable changes to `@nestbolt/authentication` will be documented in this file.

## 0.1.0

### Features

- **Initial release** — Frontend-agnostic authentication backend for NestJS
- **Registration** — User registration with customizable creation logic
- **Login/Logout** — JWT-based authentication with access and refresh tokens
- **Password Reset** — Forgot password and reset password flows
- **Email Verification** — Signed URL-based email verification
- **Profile Updates** — Update user profile information
- **Password Updates** — Change password for authenticated users
- **Password Confirmation** — Confirm password for sensitive actions with configurable timeout
- **Two-Factor Authentication** — TOTP-based 2FA with QR code generation
- **Recovery Codes** — 8 recovery codes per user for 2FA backup
- **Feature Flags** — Enable/disable features via module configuration
- **Database Agnostic** — Repository pattern supports any database (SQL, NoSQL, etc.)
- **Events** — 15 authentication events via @nestjs/event-emitter
- **Rate Limiting** — Configurable rate limiting for login and verification
