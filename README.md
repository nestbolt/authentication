<p align="center">
  <h1 align="center">@nestbolt/authentication</h1>
  <p align="center">Frontend-agnostic authentication backend for NestJS</p>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@nestbolt/authentication"><img src="https://img.shields.io/npm/v/@nestbolt/authentication.svg" alt="NPM Version" /></a>
  <a href="https://www.npmjs.com/package/@nestbolt/authentication"><img src="https://img.shields.io/npm/dt/@nestbolt/authentication.svg" alt="NPM Downloads" /></a>
  <a href="https://github.com/nestbolt/authentication/actions"><img src="https://github.com/nestbolt/authentication/workflows/Tests/badge.svg" alt="Tests" /></a>
  <a href="https://github.com/nestbolt/authentication/blob/main/LICENSE.md"><img src="https://img.shields.io/npm/l/@nestbolt/authentication.svg" alt="License" /></a>
</p>

---

A complete, database-agnostic authentication backend for NestJS with support for registration, login, password reset, email verification, profile management, password confirmation, and two-factor authentication (TOTP).

Inspired by [Laravel Fortify](https://github.com/laravel/fortify).

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Module Configuration](#module-configuration)
- [Features](#features)
- [Database Adapters](#database-adapters)
- [API Routes](#api-routes)
- [Events](#events)
- [Configuration Options](#configuration-options)
- [Testing](#testing)
- [Changelog](#changelog)
- [Contributing](#contributing)
- [License](#license)

## Installation

```bash
# pnpm
pnpm add @nestbolt/authentication

# npm
npm install @nestbolt/authentication

# yarn
yarn add @nestbolt/authentication
```

### Peer Dependencies

```bash
pnpm add @nestjs/passport @nestjs/jwt passport passport-jwt passport-local class-validator class-transformer reflect-metadata
```

Optional:

```bash
pnpm add @nestjs/event-emitter
```

## Quick Start

1. **Implement the `UserRepository` interface** for your database:

```typescript
import { Injectable } from "@nestjs/common";
import { UserRepository, AuthUser } from "@nestbolt/authentication";

@Injectable()
export class MyUserRepository implements UserRepository {
  async findById(id: string): Promise<AuthUser | null> {
    /* ... */
  }
  async findByField(field: string, value: string): Promise<AuthUser | null> {
    /* ... */
  }
  async save(user: Partial<AuthUser> & { id: string }): Promise<AuthUser> {
    /* ... */
  }
  async create(data: Omit<AuthUser, "id">): Promise<AuthUser> {
    /* ... */
  }
}
```

2. **Import `AuthenticationModule`** in your app module:

```typescript
import { AuthenticationModule, Feature } from "@nestbolt/authentication";
import { MyUserRepository } from "./my-user.repository";

@Module({
  imports: [
    AuthenticationModule.forRoot({
      features: [
        Feature.REGISTRATION,
        Feature.RESET_PASSWORDS,
        Feature.EMAIL_VERIFICATION,
        Feature.UPDATE_PROFILE_INFORMATION,
        Feature.UPDATE_PASSWORDS,
        Feature.TWO_FACTOR_AUTHENTICATION,
      ],
      userRepository: MyUserRepository,
      jwtSecret: process.env.JWT_SECRET!,
      refreshSecret: process.env.REFRESH_SECRET!,
      encryptionKey: process.env.ENCRYPTION_KEY!, // 32-byte base64
      appName: "MyApp",
    }),
  ],
})
export class AppModule {}
```

3. **That's it!** All 19 auth routes are now available.

## Module Configuration

### Synchronous

```typescript
AuthenticationModule.forRoot({
  features: [Feature.REGISTRATION, Feature.TWO_FACTOR_AUTHENTICATION],
  userRepository: TypeOrmUserRepository,
  passwordResetRepository: TypeOrmPasswordResetRepository,
  jwtSecret: "your-jwt-secret",
  refreshSecret: "your-refresh-secret",
  encryptionKey: "base64-encoded-32-byte-key",
  appName: "MyApp",
});
```

### Asynchronous

```typescript
AuthenticationModule.forRootAsync({
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (config: ConfigService) => ({
    features: [Feature.REGISTRATION, Feature.TWO_FACTOR_AUTHENTICATION],
    userRepository: TypeOrmUserRepository,
    jwtSecret: config.get("JWT_SECRET"),
    refreshSecret: config.get("REFRESH_SECRET"),
    encryptionKey: config.get("ENCRYPTION_KEY"),
  }),
});
```

## Features

Enable or disable features via the `features` array:

| Feature                              | Description                                                       |
| ------------------------------------ | ----------------------------------------------------------------- |
| `Feature.REGISTRATION`               | User registration (POST /register)                                |
| `Feature.RESET_PASSWORDS`            | Password reset flow (POST /forgot-password, POST /reset-password) |
| `Feature.EMAIL_VERIFICATION`         | Email verification (GET /email/verify/:id/:hash)                  |
| `Feature.UPDATE_PROFILE_INFORMATION` | Profile updates (PUT /user/profile-information)                   |
| `Feature.UPDATE_PASSWORDS`           | Password updates (PUT /user/password)                             |
| `Feature.TWO_FACTOR_AUTHENTICATION`  | Full 2FA with TOTP, QR codes, and recovery codes                  |

## Database Adapters

The package is **database-agnostic**. Implement `UserRepository` and optionally `PasswordResetRepository` for any database:

### TypeORM (SQL)

```typescript
@Injectable()
export class TypeOrmUserRepository implements UserRepository {
  constructor(@InjectRepository(User) private repo: Repository<User>) {}
  findById(id: string) {
    return this.repo.findOneBy({ id });
  }
  findByField(field: string, value: string) {
    return this.repo.findOneBy({ [field]: value });
  }
  save(user) {
    return this.repo.save(user);
  }
  create(data) {
    return this.repo.save(this.repo.create(data));
  }
}
```

### Mongoose (MongoDB)

```typescript
@Injectable()
export class MongooseUserRepository implements UserRepository {
  constructor(@InjectModel(User.name) private model: Model<UserDocument>) {}
  findById(id: string) {
    return this.model.findById(id).lean().exec();
  }
  findByField(field: string, value: string) {
    return this.model
      .findOne({ [field]: value })
      .lean()
      .exec();
  }
  save(user) {
    return this.model.findByIdAndUpdate(user.id, user, { new: true }).lean().exec();
  }
  create(data) {
    return this.model.create(data);
  }
}
```

### Prisma, MikroORM, DynamoDB, etc.

Same pattern - implement the interface for your ORM/driver.

## API Routes

| Method   | Route                                     | Description          | Auth          |
| -------- | ----------------------------------------- | -------------------- | ------------- |
| POST     | /login                                    | Authenticate user    | No            |
| POST     | /refresh                                  | Refresh access token | Refresh Token |
| POST     | /logout                                   | Log out              | JWT           |
| POST     | /register                                 | Create new user      | No            |
| POST     | /forgot-password                          | Send reset link      | No            |
| POST     | /reset-password                           | Reset password       | No            |
| GET      | /email/verify/:id/:hash                   | Verify email         | JWT           |
| POST     | /email/verification-notification          | Resend verification  | JWT           |
| PUT      | /user/profile-information                 | Update profile       | JWT           |
| PUT      | /user/password                            | Change password      | JWT           |
| POST     | /user/confirm-password                    | Confirm password     | JWT           |
| GET      | /user/confirmed-password-status           | Check confirmation   | JWT           |
| POST     | /user/two-factor-authentication           | Enable 2FA           | JWT           |
| DELETE   | /user/two-factor-authentication           | Disable 2FA          | JWT           |
| POST     | /user/confirmed-two-factor-authentication | Confirm 2FA setup    | JWT           |
| GET      | /user/two-factor-qr-code                  | Get QR code SVG      | JWT           |
| GET      | /user/two-factor-secret-key               | Get TOTP secret      | JWT           |
| GET/POST | /user/two-factor-recovery-codes           | Get/regenerate codes | JWT           |
| POST     | /two-factor-challenge                     | Complete 2FA login   | No            |

## Events

Subscribe to authentication events using `@nestjs/event-emitter`:

```typescript
import { OnEvent } from "@nestjs/event-emitter";
import { AUTH_EVENTS, UserEvent } from "@nestbolt/authentication";

@Injectable()
export class AuthListener {
  @OnEvent(AUTH_EVENTS.LOGIN)
  handleLogin(payload: UserEvent) {
    console.log(`User ${payload.user.email} logged in`);
  }
}
```

Available events: `auth.login`, `auth.logout`, `auth.registered`, `auth.lockout`, `auth.password-reset`, `auth.password-updated`, `auth.email-verified`, `auth.two-factor-enabled`, `auth.two-factor-disabled`, `auth.two-factor-confirmed`, `auth.two-factor-challenged`, `auth.two-factor-failed`, `auth.valid-two-factor-code`, `auth.recovery-code-replaced`, `auth.recovery-codes-generated`

## Configuration Options

| Option                             | Type                            | Default        | Description                             |
| ---------------------------------- | ------------------------------- | -------------- | --------------------------------------- |
| `features`                         | `Feature[]`                     | _required_     | Enabled features                        |
| `userRepository`                   | `Type<UserRepository>`          | _required_     | User repository class                   |
| `passwordResetRepository`          | `Type<PasswordResetRepository>` | -              | Password reset token storage            |
| `jwtSecret`                        | `string`                        | _required_     | JWT signing secret                      |
| `refreshSecret`                    | `string`                        | _required_     | Refresh token secret                    |
| `encryptionKey`                    | `string`                        | _required_     | 32-byte base64 key for 2FA encryption   |
| `jwtExpiresIn`                     | `string`                        | `"15m"`        | Access token TTL                        |
| `refreshExpiresIn`                 | `string`                        | `"7d"`         | Refresh token TTL                       |
| `usernameField`                    | `string`                        | `"email"`      | Login username field                    |
| `lowercaseUsernames`               | `boolean`                       | `true`         | Lowercase usernames on login            |
| `loginRateLimit`                   | `{ ttl, limit }`                | `{ 60000, 5 }` | Login rate limiting                     |
| `twoFactorRateLimit`               | `{ ttl, limit }`                | `{ 60000, 5 }` | Two-factor challenge rate limiting      |
| `verificationRateLimit`            | `{ ttl, limit }`                | `{ 60000, 6 }` | Email verification rate limiting        |
| `passwordTimeout`                  | `number`                        | `900`          | Password confirmation timeout (seconds) |
| `appName`                          | `string`                        | `"NestBolt"`   | App name for TOTP QR codes              |
| `twoFactorOptions.confirm`         | `boolean`                       | `false`        | Require 2FA confirmation step           |
| `twoFactorOptions.confirmPassword` | `boolean`                       | `false`        | Require password before 2FA changes     |
| `twoFactorOptions.window`          | `number`                        | `1`            | TOTP time window                        |
| `twoFactorOptions.secretLength`    | `number`                        | `20`           | TOTP secret key length                  |

## Testing

```bash
pnpm test          # Run tests
pnpm test:watch    # Watch mode
pnpm test:cov      # Coverage report
```

## Changelog

See [CHANGELOG.md](CHANGELOG.md).

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## Security

For security-related issues, please use the **security** label on [GitHub Issues](https://github.com/nestbolt/authentication/issues).

## Credits

- Inspired by [Laravel Fortify](https://github.com/laravel/fortify) by Taylor Otwell

## License

[MIT License](LICENSE.md)
