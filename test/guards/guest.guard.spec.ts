import { describe, it, expect } from "vitest";
import { ForbiddenException } from "@nestjs/common";
import { GuestGuard } from "../../src/guards/guest.guard";

describe("GuestGuard", () => {
  const guard = new GuestGuard();

  function createMockContext(user?: any) {
    return {
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    } as any;
  }

  it("should allow access when no user is present on the request", () => {
    const context = createMockContext(undefined);
    expect(guard.canActivate(context)).toBe(true);
  });

  it("should allow access when user is null", () => {
    const context = createMockContext(null);
    expect(guard.canActivate(context)).toBe(true);
  });

  it("should allow access when user is an empty string (falsy)", () => {
    const context = createMockContext("");
    expect(guard.canActivate(context)).toBe(true);
  });

  it("should allow access when user is 0 (falsy)", () => {
    const context = createMockContext(0);
    expect(guard.canActivate(context)).toBe(true);
  });

  it("should throw ForbiddenException when user is present", () => {
    const context = createMockContext({ id: "1", email: "test@example.com" });
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    expect(() => guard.canActivate(context)).toThrow("You are already authenticated.");
  });

  it("should throw ForbiddenException when user is a truthy value", () => {
    const context = createMockContext(true);
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });
});
