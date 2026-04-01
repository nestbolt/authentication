import { describe, it, expect, beforeEach, vi } from "vitest";
import { UnauthorizedException } from "@nestjs/common";
import { JwtRefreshStrategy } from "../../src/strategies/jwt-refresh.strategy";
import { AuthenticationModuleOptions, UserRepository } from "../../src/interfaces";

describe("JwtRefreshStrategy", () => {
  let strategy: JwtRefreshStrategy;
  let mockUserRepository: { findById: ReturnType<typeof vi.fn> };

  function createOptions(overrides: Partial<AuthenticationModuleOptions> = {}): AuthenticationModuleOptions {
    return {
      features: [],
      jwtSecret: "test-jwt-secret",
      refreshSecret: "test-refresh-secret",
      encryptionKey: "test",
      userRepository: class {} as any,
      ...overrides,
    };
  }

  beforeEach(() => {
    mockUserRepository = {
      findById: vi.fn(),
    };
    strategy = new JwtRefreshStrategy(createOptions(), mockUserRepository as any);
  });

  it("should be defined", () => {
    expect(strategy).toBeDefined();
  });

  it("should return the user when found by payload.sub", async () => {
    const mockUser = { id: "user-1", email: "test@example.com", name: "Test" };
    mockUserRepository.findById.mockResolvedValue(mockUser);

    const result = await strategy.validate({ sub: "user-1" });

    expect(result).toEqual(mockUser);
    expect(mockUserRepository.findById).toHaveBeenCalledWith("user-1");
  });

  it("should throw UnauthorizedException when user is not found (null)", async () => {
    mockUserRepository.findById.mockResolvedValue(null);

    await expect(strategy.validate({ sub: "nonexistent" })).rejects.toThrow(UnauthorizedException);
    expect(mockUserRepository.findById).toHaveBeenCalledWith("nonexistent");
  });

  it("should throw UnauthorizedException when user is not found (undefined)", async () => {
    mockUserRepository.findById.mockResolvedValue(undefined);

    await expect(strategy.validate({ sub: "nonexistent" })).rejects.toThrow(UnauthorizedException);
  });

  it("should call findById with the sub from the payload", async () => {
    mockUserRepository.findById.mockResolvedValue({ id: "abc" });

    await strategy.validate({ sub: "abc" });

    expect(mockUserRepository.findById).toHaveBeenCalledTimes(1);
    expect(mockUserRepository.findById).toHaveBeenCalledWith("abc");
  });

  it("should use refreshSecret from options", () => {
    const customStrategy = new JwtRefreshStrategy(
      createOptions({ refreshSecret: "custom-refresh-secret" }),
      mockUserRepository as any,
    );
    expect(customStrategy).toBeDefined();
  });
});
