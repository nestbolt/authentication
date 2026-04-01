import { describe, it, expect, beforeEach, vi } from "vitest";
import { TwoFactorThrottleGuard } from "../../src/guards/two-factor-throttle.guard";
import { HttpException, HttpStatus } from "@nestjs/common";

describe("TwoFactorThrottleGuard", () => {
  let guard: TwoFactorThrottleGuard;

  const options = {
    features: [],
    jwtSecret: "test",
    refreshSecret: "test",
    encryptionKey: "test",
    userRepository: class {} as any,
    twoFactorRateLimit: { ttl: 60000, limit: 3 },
  };

  function createMockContext(challengeToken: string = "token123", ip: string = "127.0.0.1") {
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          body: { challengeToken },
          ip,
        }),
      }),
    } as any;
  }

  function createMockRequest(challengeToken: string = "token123", ip: string = "127.0.0.1") {
    return { body: { challengeToken }, ip };
  }

  beforeEach(() => {
    guard = new TwoFactorThrottleGuard(options as any);
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

  it("should track different IPs separately", () => {
    const request1 = createMockRequest("token-a", "10.0.0.1");

    for (let i = 0; i < 3; i++) {
      guard.increment(request1);
    }

    const context2 = createMockContext("token-b", "10.0.0.2");
    expect(guard.canActivate(context2)).toBe(true);
  });

  it("should share limit across different challenge tokens from same IP", () => {
    const request1 = createMockRequest("token-a", "10.0.0.1");
    const request2 = createMockRequest("token-b", "10.0.0.1");

    guard.increment(request1);
    guard.increment(request1);
    guard.increment(request2);

    const context = createMockContext("token-c", "10.0.0.1");
    expect(() => guard.canActivate(context)).toThrow(HttpException);
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

  it("should use default config when twoFactorRateLimit is not set", () => {
    const optionsNoLimit = {
      features: [],
      jwtSecret: "test",
      refreshSecret: "test",
      encryptionKey: "test",
      userRepository: class {} as any,
    };
    guard = new TwoFactorThrottleGuard(optionsNoLimit as any);

    const request = createMockRequest();
    // Default limit is 5
    for (let i = 0; i < 5; i++) {
      guard.increment(request);
    }

    const context = createMockContext();
    expect(() => guard.canActivate(context)).toThrow(HttpException);
  });

  it("should handle missing ip in throttle key", () => {
    const request = { body: {}, ip: undefined } as any;
    guard.increment(request);

    const context = {
      switchToHttp: () => ({
        getRequest: () => ({ body: {}, ip: undefined }),
      }),
    } as any;
    expect(guard.canActivate(context)).toBe(true);
  });
});
