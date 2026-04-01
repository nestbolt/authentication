import { describe, it, expect, beforeEach, vi } from "vitest";
import { LoginThrottleGuard } from "../../src/guards/login-throttle.guard";
import { HttpException, HttpStatus } from "@nestjs/common";

describe("LoginThrottleGuard", () => {
  let guard: LoginThrottleGuard;

  const options = {
    features: [],
    jwtSecret: "test",
    refreshSecret: "test",
    encryptionKey: "test",
    userRepository: class {} as any,
    loginRateLimit: { ttl: 60000, limit: 3 },
  };

  function createMockContext(email: string = "test@example.com", ip: string = "127.0.0.1") {
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          body: { email },
          ip,
        }),
      }),
    } as any;
  }

  function createMockRequest(email: string = "test@example.com", ip: string = "127.0.0.1") {
    return { body: { email }, ip };
  }

  beforeEach(() => {
    guard = new LoginThrottleGuard(options as any);
  });

  it("should allow first request", () => {
    const context = createMockContext();
    expect(guard.canActivate(context)).toBe(true);
  });

  it("should block after limit is reached", () => {
    const request = createMockRequest();
    for (let i = 0; i < 3; i++) {
      guard.increment(request);
    }

    const context = createMockContext();
    expect(() => guard.canActivate(context)).toThrow(HttpException);
  });

  it("should return 429 status code when blocked", () => {
    const request = createMockRequest();
    for (let i = 0; i < 3; i++) {
      guard.increment(request);
    }

    const context = createMockContext();
    try {
      guard.canActivate(context);
    } catch (e) {
      expect((e as HttpException).getStatus()).toBe(HttpStatus.TOO_MANY_REQUESTS);
    }
  });

  it("should allow after clearing attempts", () => {
    const request = createMockRequest();
    for (let i = 0; i < 3; i++) {
      guard.increment(request);
    }

    guard.clear(request);

    const context = createMockContext();
    expect(guard.canActivate(context)).toBe(true);
  });

  it("should track different users separately", () => {
    const request1 = createMockRequest("user1@test.com");
    createMockRequest("user2@test.com");

    for (let i = 0; i < 3; i++) {
      guard.increment(request1);
    }

    const context2 = createMockContext("user2@test.com");
    expect(guard.canActivate(context2)).toBe(true);
  });

  it("should reset counter after TTL window expires in increment", () => {
    const now = Date.now();
    vi.spyOn(Date, "now").mockReturnValue(now);

    const request = createMockRequest();
    for (let i = 0; i < 3; i++) {
      guard.increment(request);
    }

    // Advance past TTL
    vi.spyOn(Date, "now").mockReturnValue(now + 60001);

    // Increment again — should reset the counter
    guard.increment(request);

    // Should not be blocked because counter was reset to 1
    const context = createMockContext();
    expect(guard.canActivate(context)).toBe(true);

    vi.restoreAllMocks();
  });

  it("should emit lockout event when event emitter is provided", () => {
    const eventEmitter = { emit: vi.fn() };
    guard = new LoginThrottleGuard(options as any, eventEmitter as any);

    const request = createMockRequest();
    for (let i = 0; i < 3; i++) {
      guard.increment(request);
    }

    const context = createMockContext();
    try {
      guard.canActivate(context);
    } catch {
      // expected
    }

    expect(eventEmitter.emit).toHaveBeenCalled();
  });

  it("should use default config when loginRateLimit is not set", () => {
    const optionsNoLimit = {
      features: [],
      jwtSecret: "test",
      refreshSecret: "test",
      encryptionKey: "test",
      userRepository: class {} as any,
    };
    guard = new LoginThrottleGuard(optionsNoLimit as any);

    const request = createMockRequest();
    // Default limit is 5
    for (let i = 0; i < 5; i++) {
      guard.increment(request);
    }

    const context = createMockContext();
    expect(() => guard.canActivate(context)).toThrow(HttpException);
  });

  it("should handle missing email and ip in throttle key", () => {
    const request = { body: {}, ip: undefined } as any;
    guard.increment(request);

    const context = {
      switchToHttp: () => ({
        getRequest: () => ({ body: {}, ip: undefined }),
      }),
    } as any;
    expect(guard.canActivate(context)).toBe(true);
  });

  it("should use custom usernameField for throttle key", () => {
    const customOptions = {
      ...options,
      usernameField: "username",
    };
    guard = new LoginThrottleGuard(customOptions as any);

    const request = { body: { username: "admin" }, ip: "10.0.0.1" };
    for (let i = 0; i < 3; i++) {
      guard.increment(request);
    }

    // Different username should not be blocked
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({ body: { username: "other" }, ip: "10.0.0.1" }),
      }),
    } as any;
    expect(guard.canActivate(context)).toBe(true);
  });
});
