import { describe, it, expect, beforeEach, vi } from "vitest";
import { VerificationThrottleGuard } from "../../src/guards/verification-throttle.guard";
import { HttpException, HttpStatus } from "@nestjs/common";

describe("VerificationThrottleGuard", () => {
  let guard: VerificationThrottleGuard;

  const options = {
    features: [],
    jwtSecret: "test",
    refreshSecret: "test",
    encryptionKey: "test",
    userRepository: class {} as any,
    verificationRateLimit: { ttl: 60000, limit: 3 },
  };

  function createMockContext(userId: string = "user-1", ip: string = "127.0.0.1") {
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          user: { id: userId },
          ip,
        }),
      }),
    } as any;
  }

  beforeEach(() => {
    guard = new VerificationThrottleGuard(options as any);
  });

  it("should allow first request", () => {
    const context = createMockContext();
    expect(guard.canActivate(context)).toBe(true);
  });

  it("should block after limit is reached", () => {
    for (let i = 0; i < 3; i++) {
      guard.canActivate(createMockContext());
    }

    expect(() => guard.canActivate(createMockContext())).toThrow(HttpException);
  });

  it("should return 429 status code when blocked", () => {
    for (let i = 0; i < 3; i++) {
      guard.canActivate(createMockContext());
    }

    try {
      guard.canActivate(createMockContext());
    } catch (e) {
      expect((e as HttpException).getStatus()).toBe(HttpStatus.TOO_MANY_REQUESTS);
    }
  });

  it("should track different users separately", () => {
    for (let i = 0; i < 3; i++) {
      guard.canActivate(createMockContext("user-1"));
    }

    expect(guard.canActivate(createMockContext("user-2"))).toBe(true);
  });

  it("should reset counter after TTL window expires", () => {
    const now = Date.now();
    vi.spyOn(Date, "now").mockReturnValue(now);

    for (let i = 0; i < 3; i++) {
      guard.canActivate(createMockContext());
    }

    expect(() => guard.canActivate(createMockContext())).toThrow(HttpException);

    // Advance past TTL
    vi.spyOn(Date, "now").mockReturnValue(now + 60001);

    expect(guard.canActivate(createMockContext())).toBe(true);

    vi.restoreAllMocks();
  });

  it("should use default config when verificationRateLimit is not set", () => {
    const optionsNoLimit = {
      features: [],
      jwtSecret: "test",
      refreshSecret: "test",
      encryptionKey: "test",
      userRepository: class {} as any,
    };
    guard = new VerificationThrottleGuard(optionsNoLimit as any);

    // Default limit is 6
    for (let i = 0; i < 6; i++) {
      guard.canActivate(createMockContext());
    }

    expect(() => guard.canActivate(createMockContext())).toThrow(HttpException);
  });

  it("should handle missing user and ip in throttle key", () => {
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({ user: undefined, ip: undefined }),
      }),
    } as any;

    expect(guard.canActivate(context)).toBe(true);
  });

  it("should handle user with no id", () => {
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({ user: {}, ip: "127.0.0.1" }),
      }),
    } as any;

    expect(guard.canActivate(context)).toBe(true);
  });
});
