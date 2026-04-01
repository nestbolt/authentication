import { describe, it, expect, beforeEach, vi } from "vitest";
import { UnauthorizedException } from "@nestjs/common";
import { LocalStrategy } from "../../src/strategies/local.strategy";
import { AuthenticationModuleOptions } from "../../src/interfaces";

describe("LocalStrategy", () => {
  let strategy: LocalStrategy;
  let mockAuthService: { validateCredentials: ReturnType<typeof vi.fn> };

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

  beforeEach(() => {
    mockAuthService = {
      validateCredentials: vi.fn(),
    };
    strategy = new LocalStrategy(mockAuthService as any, createOptions());
  });

  it("should be defined", () => {
    expect(strategy).toBeDefined();
  });

  it("should return the user when credentials are valid", async () => {
    const mockUser = { id: "1", email: "test@example.com", name: "Test" };
    mockAuthService.validateCredentials.mockResolvedValue(mockUser);

    const result = await strategy.validate("test@example.com", "password");

    expect(result).toEqual(mockUser);
    expect(mockAuthService.validateCredentials).toHaveBeenCalledWith(
      "test@example.com",
      "password",
    );
  });

  it("should throw UnauthorizedException when user is null", async () => {
    mockAuthService.validateCredentials.mockResolvedValue(null);

    await expect(strategy.validate("test@example.com", "wrong")).rejects.toThrow(
      UnauthorizedException,
    );
    await expect(strategy.validate("test@example.com", "wrong")).rejects.toThrow(
      "These credentials do not match our records.",
    );
  });

  it("should throw UnauthorizedException when user is undefined", async () => {
    mockAuthService.validateCredentials.mockResolvedValue(undefined);

    await expect(strategy.validate("test@example.com", "wrong")).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it("should use custom usernameField from options", () => {
    const customStrategy = new LocalStrategy(
      mockAuthService as any,
      createOptions({ usernameField: "username" }),
    );
    expect(customStrategy).toBeDefined();
  });

  it("should use default email usernameField when not specified", () => {
    const defaultStrategy = new LocalStrategy(mockAuthService as any, createOptions());
    expect(defaultStrategy).toBeDefined();
  });
});
