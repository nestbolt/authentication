import { describe, it, expect } from "vitest";
import { LocalAuthGuard } from "../../src/guards/local-auth.guard";

describe("LocalAuthGuard", () => {
  it("should be defined and instantiable", () => {
    const guard = new LocalAuthGuard();
    expect(guard).toBeDefined();
    expect(guard).toBeInstanceOf(LocalAuthGuard);
  });

  it("should have canActivate method from AuthGuard", () => {
    const guard = new LocalAuthGuard();
    expect(typeof guard.canActivate).toBe("function");
  });

  it("should have getRequest method from AuthGuard", () => {
    const guard = new LocalAuthGuard();
    expect(typeof guard.getRequest).toBe("function");
  });
});
