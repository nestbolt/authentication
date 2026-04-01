import { describe, it, expect, beforeEach } from "vitest";
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
    const request2 = createMockRequest("user2@test.com");

    for (let i = 0; i < 3; i++) {
      guard.increment(request1);
    }

    const context2 = createMockContext("user2@test.com");
    expect(guard.canActivate(context2)).toBe(true);
  });
});
