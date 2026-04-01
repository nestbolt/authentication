import { describe, it, expect, beforeEach, vi } from "vitest";
import { UnauthorizedException } from "@nestjs/common";
import { JwtStrategy } from "../../src/strategies/jwt.strategy";
import { AuthenticationModuleOptions } from "../../src/interfaces";

describe("JwtStrategy", () => {
  let strategy: JwtStrategy;
  let mockUserRepository: { findById: ReturnType<typeof vi.fn> };

  function createOptions(
    overrides: Partial<AuthenticationModuleOptions> = {},
  ): AuthenticationModuleOptions {
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
    strategy = new JwtStrategy(createOptions(), mockUserRepository as any);
  });

  it("should be defined", () => {
    expect(strategy).toBeDefined();
  });

  it("should return the user when found by payload.sub", async () => {
    const mockUser = { id: "user-1", email: "test@example.com", name: "Test" };
    mockUserRepository.findById.mockResolvedValue(mockUser);

    const result = await strategy.validate({ sub: "user-1", email: "test@example.com" });

    expect(result).toEqual(mockUser);
    expect(mockUserRepository.findById).toHaveBeenCalledWith("user-1");
  });

  it("should throw UnauthorizedException when user is not found", async () => {
    mockUserRepository.findById.mockResolvedValue(null);

    await expect(
      strategy.validate({ sub: "nonexistent", email: "test@example.com" }),
    ).rejects.toThrow(UnauthorizedException);
    expect(mockUserRepository.findById).toHaveBeenCalledWith("nonexistent");
  });

  it("should throw UnauthorizedException when user is undefined", async () => {
    mockUserRepository.findById.mockResolvedValue(undefined);

    await expect(
      strategy.validate({ sub: "nonexistent", email: "test@example.com" }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it("should call findById with the sub from the payload", async () => {
    mockUserRepository.findById.mockResolvedValue({ id: "abc" });

    await strategy.validate({ sub: "abc", email: "any@example.com" });

    expect(mockUserRepository.findById).toHaveBeenCalledTimes(1);
    expect(mockUserRepository.findById).toHaveBeenCalledWith("abc");
  });
});
