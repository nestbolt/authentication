import { describe, it, expect } from "vitest";
import { ForbiddenException } from "@nestjs/common";
import { PasswordConfirmedGuard } from "../../src/guards/password-confirmed.guard";
import { AuthenticationModuleOptions } from "../../src/interfaces";

describe("PasswordConfirmedGuard", () => {
  function createMockContext(user?: any) {
    return {
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    } as any;
  }

  function createOptions(
    overrides: Partial<AuthenticationModuleOptions> = {},
  ): AuthenticationModuleOptions {
    return {
      features: [],
      jwtSecret: "test",
      refreshSecret: "test",
      encryptionKey: "test",
      userRepository: class {} as any,
      ...overrides,
    };
  }

  it("should allow access when confirmPassword option is not set", () => {
    const guard = new PasswordConfirmedGuard(createOptions());
    const context = createMockContext();

    expect(guard.canActivate(context)).toBe(true);
  });

  it("should allow access when twoFactorOptions is undefined", () => {
    const guard = new PasswordConfirmedGuard(createOptions({ twoFactorOptions: undefined }));
    const context = createMockContext();

    expect(guard.canActivate(context)).toBe(true);
  });

  it("should allow access when confirmPassword is false", () => {
    const guard = new PasswordConfirmedGuard(
      createOptions({ twoFactorOptions: { confirmPassword: false } }),
    );
    const context = createMockContext({ passwordConfirmedAt: new Date().toISOString() });

    expect(guard.canActivate(context)).toBe(true);
  });

  it("should throw ForbiddenException when confirmPassword is true and user has no passwordConfirmedAt", () => {
    const guard = new PasswordConfirmedGuard(
      createOptions({ twoFactorOptions: { confirmPassword: true } }),
    );
    const context = createMockContext({ passwordConfirmedAt: null });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    expect(() => guard.canActivate(context)).toThrow("Password confirmation required.");
  });

  it("should throw ForbiddenException when confirmPassword is true and user is undefined", () => {
    const guard = new PasswordConfirmedGuard(
      createOptions({ twoFactorOptions: { confirmPassword: true } }),
    );
    const context = createMockContext(undefined);

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    expect(() => guard.canActivate(context)).toThrow("Password confirmation required.");
  });

  it("should throw ForbiddenException when confirmPassword is true and user is null", () => {
    const guard = new PasswordConfirmedGuard(
      createOptions({ twoFactorOptions: { confirmPassword: true } }),
    );
    const context = createMockContext(null);

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    expect(() => guard.canActivate(context)).toThrow("Password confirmation required.");
  });

  it("should throw ForbiddenException when password confirmation has expired (default 900s timeout)", () => {
    const guard = new PasswordConfirmedGuard(
      createOptions({ twoFactorOptions: { confirmPassword: true } }),
    );
    // Set confirmedAt to 901 seconds ago
    const confirmedAt = new Date(Date.now() - 901 * 1000).toISOString();
    const context = createMockContext({ passwordConfirmedAt: confirmedAt });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    expect(() => guard.canActivate(context)).toThrow("Password confirmation has expired.");
  });

  it("should allow access when password was confirmed within the default timeout", () => {
    const guard = new PasswordConfirmedGuard(
      createOptions({ twoFactorOptions: { confirmPassword: true } }),
    );
    // Set confirmedAt to 10 seconds ago
    const confirmedAt = new Date(Date.now() - 10 * 1000).toISOString();
    const context = createMockContext({ passwordConfirmedAt: confirmedAt });

    expect(guard.canActivate(context)).toBe(true);
  });

  it("should use custom passwordTimeout when provided", () => {
    const guard = new PasswordConfirmedGuard(
      createOptions({
        twoFactorOptions: { confirmPassword: true },
        passwordTimeout: 60, // 60 seconds
      }),
    );
    // Set confirmedAt to 61 seconds ago
    const confirmedAt = new Date(Date.now() - 61 * 1000).toISOString();
    const context = createMockContext({ passwordConfirmedAt: confirmedAt });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    expect(() => guard.canActivate(context)).toThrow("Password confirmation has expired.");
  });

  it("should allow access with custom passwordTimeout when within limit", () => {
    const guard = new PasswordConfirmedGuard(
      createOptions({
        twoFactorOptions: { confirmPassword: true },
        passwordTimeout: 60,
      }),
    );
    // Set confirmedAt to 30 seconds ago
    const confirmedAt = new Date(Date.now() - 30 * 1000).toISOString();
    const context = createMockContext({ passwordConfirmedAt: confirmedAt });

    expect(guard.canActivate(context)).toBe(true);
  });

  it("should handle passwordTimeout of 0 (immediately expired)", () => {
    const guard = new PasswordConfirmedGuard(
      createOptions({
        twoFactorOptions: { confirmPassword: true },
        passwordTimeout: 0,
      }),
    );
    // Even a very recent confirmation would be expired with timeout = 0
    const confirmedAt = new Date(Date.now() - 1 * 1000).toISOString();
    const context = createMockContext({ passwordConfirmedAt: confirmedAt });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it("should handle user with passwordConfirmedAt as a Date object", () => {
    const guard = new PasswordConfirmedGuard(
      createOptions({ twoFactorOptions: { confirmPassword: true } }),
    );
    const confirmedAt = new Date(Date.now() - 10 * 1000);
    const context = createMockContext({ passwordConfirmedAt: confirmedAt });

    expect(guard.canActivate(context)).toBe(true);
  });
});
