import { describe, it, expect, beforeEach, vi } from "vitest";
import { ConfirmPasswordService } from "../../src/services/confirm-password.service";
import * as bcrypt from "bcrypt";
import { AuthUser } from "../../src/interfaces";

vi.mock("bcrypt", () => ({
  compare: vi.fn(),
}));

describe("ConfirmPasswordService", () => {
  let service: ConfirmPasswordService;
  let userRepository: any;
  let options: any;

  const mockUser: AuthUser = {
    id: "user-1",
    name: "Test User",
    email: "test@example.com",
    password: "$2b$12$hashedpassword",
    emailVerifiedAt: null,
    twoFactorSecret: null,
    twoFactorRecoveryCodes: null,
    twoFactorConfirmedAt: null,
    passwordConfirmedAt: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();

    userRepository = {
      findById: vi.fn(),
      findByField: vi.fn(),
      save: vi.fn(),
      create: vi.fn(),
    };

    options = {
      jwtSecret: "jwt-secret",
      refreshSecret: "refresh-secret",
      encryptionKey: "test-key",
      features: [],
    };

    service = new ConfirmPasswordService(userRepository, options);
  });

  describe("confirm", () => {
    it("should return true when password matches", async () => {
      (bcrypt.compare as any).mockResolvedValue(true);

      const result = await service.confirm(mockUser, "correct-password");

      expect(result).toBe(true);
      expect(bcrypt.compare).toHaveBeenCalledWith("correct-password", mockUser.password);
    });

    it("should return false when password does not match", async () => {
      (bcrypt.compare as any).mockResolvedValue(false);

      const result = await service.confirm(mockUser, "wrong-password");

      expect(result).toBe(false);
    });
  });

  describe("storeConfirmationTimestamp", () => {
    it("should save a new passwordConfirmedAt timestamp", async () => {
      userRepository.save.mockResolvedValue(mockUser);

      await service.storeConfirmationTimestamp(mockUser);

      expect(userRepository.save).toHaveBeenCalledWith({
        id: "user-1",
        passwordConfirmedAt: expect.any(Date),
      });
    });
  });

  describe("isRecentlyConfirmed", () => {
    it("should return false when passwordConfirmedAt is null", async () => {
      const result = await service.isRecentlyConfirmed(mockUser);
      expect(result).toBe(false);
    });

    it("should return true when confirmed within default timeout (900s)", async () => {
      const user = {
        ...mockUser,
        passwordConfirmedAt: new Date(Date.now() - 100 * 1000),
      };
      const result = await service.isRecentlyConfirmed(user);
      expect(result).toBe(true);
    });

    it("should return false when confirmed outside default timeout", async () => {
      const user = {
        ...mockUser,
        passwordConfirmedAt: new Date(Date.now() - 1000 * 1000),
      };
      const result = await service.isRecentlyConfirmed(user);
      expect(result).toBe(false);
    });

    it("should use custom seconds parameter", async () => {
      const user = {
        ...mockUser,
        passwordConfirmedAt: new Date(Date.now() - 50 * 1000),
      };
      const result = await service.isRecentlyConfirmed(user, 60);
      expect(result).toBe(true);
    });

    it("should return false when custom seconds are exceeded", async () => {
      const user = {
        ...mockUser,
        passwordConfirmedAt: new Date(Date.now() - 120 * 1000),
      };
      const result = await service.isRecentlyConfirmed(user, 60);
      expect(result).toBe(false);
    });

    it("should use passwordTimeout from options when no seconds parameter", async () => {
      options.passwordTimeout = 60;
      service = new ConfirmPasswordService(userRepository, options);

      const user = {
        ...mockUser,
        passwordConfirmedAt: new Date(Date.now() - 50 * 1000),
      };
      const result = await service.isRecentlyConfirmed(user);
      expect(result).toBe(true);
    });

    it("should return false when passwordTimeout from options is exceeded", async () => {
      options.passwordTimeout = 30;
      service = new ConfirmPasswordService(userRepository, options);

      const user = {
        ...mockUser,
        passwordConfirmedAt: new Date(Date.now() - 50 * 1000),
      };
      const result = await service.isRecentlyConfirmed(user);
      expect(result).toBe(false);
    });

    it("should prefer seconds parameter over options.passwordTimeout", async () => {
      options.passwordTimeout = 10;
      service = new ConfirmPasswordService(userRepository, options);

      const user = {
        ...mockUser,
        passwordConfirmedAt: new Date(Date.now() - 50 * 1000),
      };
      // seconds=60 overrides passwordTimeout=10
      const result = await service.isRecentlyConfirmed(user, 60);
      expect(result).toBe(true);
    });

    it("should return true when confirmed exactly at the boundary", async () => {
      const user = {
        ...mockUser,
        passwordConfirmedAt: new Date(Date.now()),
      };
      const result = await service.isRecentlyConfirmed(user, 0);
      expect(result).toBe(true);
    });
  });
});
