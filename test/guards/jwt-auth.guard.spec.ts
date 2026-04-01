import { describe, it, expect, beforeEach, vi } from "vitest";
import { JwtAuthGuard } from "../../src/guards/jwt-auth.guard";
import { Reflector } from "@nestjs/core";
import { AuthGuard } from "@nestjs/passport";
import { IS_PUBLIC_KEY } from "../../src/decorators/public.decorator";

describe("JwtAuthGuard", () => {
  let guard: JwtAuthGuard;
  let reflector: Reflector;

  function createMockContext() {
    return {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => ({}),
        getResponse: () => ({}),
      }),
    } as any;
  }

  beforeEach(() => {
    reflector = new Reflector();
    guard = new JwtAuthGuard(reflector);
  });

  it("should return true when route is marked as public", () => {
    reflector.getAllAndOverride = vi.fn().mockReturnValue(true);
    const context = createMockContext();

    expect(guard.canActivate(context)).toBe(true);
    expect(reflector.getAllAndOverride).toHaveBeenCalledWith(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
  });

  it("should delegate to super.canActivate when route is not public (metadata is false)", async () => {
    reflector.getAllAndOverride = vi.fn().mockReturnValue(false);
    const context = createMockContext();

    // Spy on the parent class canActivate to avoid the unhandled passport error
    const parentCanActivate = vi
      .spyOn(AuthGuard("jwt").prototype, "canActivate")
      .mockReturnValue(true);

    const result = guard.canActivate(context);

    expect(reflector.getAllAndOverride).toHaveBeenCalled();
    expect(parentCanActivate).toHaveBeenCalled();
    expect(result).toBe(true);

    parentCanActivate.mockRestore();
  });

  it("should delegate to super.canActivate when route is not public (metadata is undefined)", async () => {
    reflector.getAllAndOverride = vi.fn().mockReturnValue(undefined);
    const context = createMockContext();

    const parentCanActivate = vi
      .spyOn(AuthGuard("jwt").prototype, "canActivate")
      .mockReturnValue(false);

    const result = guard.canActivate(context);

    expect(reflector.getAllAndOverride).toHaveBeenCalled();
    expect(parentCanActivate).toHaveBeenCalled();
    expect(result).toBe(false);

    parentCanActivate.mockRestore();
  });

  it("should delegate to super.canActivate when route is not public (metadata is null)", async () => {
    reflector.getAllAndOverride = vi.fn().mockReturnValue(null);
    const context = createMockContext();

    const parentCanActivate = vi
      .spyOn(AuthGuard("jwt").prototype, "canActivate")
      .mockReturnValue(Promise.resolve(true));

    const result = await guard.canActivate(context);

    expect(reflector.getAllAndOverride).toHaveBeenCalled();
    expect(result).toBe(true);

    parentCanActivate.mockRestore();
  });
});
