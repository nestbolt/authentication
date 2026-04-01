import { describe, it, expect, beforeEach, vi } from "vitest";
import { UnauthorizedException } from "@nestjs/common";
import { AuthService } from "../../src/services/auth.service";
import * as bcrypt from "bcrypt";
import { AuthUser } from "../../src/interfaces";

vi.mock("bcrypt", () => ({
  compare: vi.fn(),
}));

describe("AuthService", () => {
  let service: AuthService;
  let userRepository: any;
  let options: any;
  let jwtService: any;

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

    jwtService = {
      sign: vi.fn(),
      verify: vi.fn(),
    };

    service = new AuthService(userRepository, options, jwtService);
  });

  describe("validateCredentials", () => {
    it("should return user when credentials are valid (default email field)", async () => {
      userRepository.findByField.mockResolvedValue(mockUser);
      (bcrypt.compare as any).mockResolvedValue(true);

      const result = await service.validateCredentials("test@example.com", "password123");

      expect(userRepository.findByField).toHaveBeenCalledWith("email", "test@example.com");
      expect(bcrypt.compare).toHaveBeenCalledWith("password123", mockUser.password);
      expect(result).toBe(mockUser);
    });

    it("should use custom usernameField from options", async () => {
      options.usernameField = "username";
      service = new AuthService(userRepository, options, jwtService);
      userRepository.findByField.mockResolvedValue(mockUser);
      (bcrypt.compare as any).mockResolvedValue(true);

      await service.validateCredentials("testuser", "password123");

      expect(userRepository.findByField).toHaveBeenCalledWith("username", "testuser");
    });

    it("should return null when user is not found", async () => {
      userRepository.findByField.mockResolvedValue(null);

      const result = await service.validateCredentials("notfound@example.com", "password123");

      expect(result).toBeNull();
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    it("should return null when password does not match", async () => {
      userRepository.findByField.mockResolvedValue(mockUser);
      (bcrypt.compare as any).mockResolvedValue(false);

      const result = await service.validateCredentials("test@example.com", "wrongpassword");

      expect(result).toBeNull();
    });
  });

  describe("generateTokens", () => {
    it("should generate access and refresh tokens with default expiration", async () => {
      jwtService.sign
        .mockReturnValueOnce("access-token")
        .mockReturnValueOnce("refresh-token");

      const result = await service.generateTokens(mockUser);

      expect(result).toEqual({ accessToken: "access-token", refreshToken: "refresh-token" });
      expect(jwtService.sign).toHaveBeenCalledWith(
        { sub: "user-1", email: "test@example.com" },
        { secret: "jwt-secret", expiresIn: "15m" },
      );
      expect(jwtService.sign).toHaveBeenCalledWith(
        { sub: "user-1", email: "test@example.com" },
        { secret: "refresh-secret", expiresIn: "7d" },
      );
    });

    it("should use custom expiration from options", async () => {
      options.jwtExpiresIn = "30m";
      options.refreshExpiresIn = "14d";
      service = new AuthService(userRepository, options, jwtService);
      jwtService.sign.mockReturnValueOnce("at").mockReturnValueOnce("rt");

      await service.generateTokens(mockUser);

      expect(jwtService.sign).toHaveBeenCalledWith(
        { sub: "user-1", email: "test@example.com" },
        { secret: "jwt-secret", expiresIn: "30m" },
      );
      expect(jwtService.sign).toHaveBeenCalledWith(
        { sub: "user-1", email: "test@example.com" },
        { secret: "refresh-secret", expiresIn: "14d" },
      );
    });
  });

  describe("createTwoFactorChallenge", () => {
    it("should create a 2FA challenge token with remember=true", async () => {
      jwtService.sign.mockReturnValue("challenge-token");

      const result = await service.createTwoFactorChallenge(mockUser, true);

      expect(result).toBe("challenge-token");
      expect(jwtService.sign).toHaveBeenCalledWith(
        { sub: "user-1", purpose: "2fa-challenge", remember: true },
        { secret: "jwt-secret", expiresIn: "5m" },
      );
    });

    it("should create a 2FA challenge token with remember=false", async () => {
      jwtService.sign.mockReturnValue("token");

      await service.createTwoFactorChallenge(mockUser, false);

      expect(jwtService.sign).toHaveBeenCalledWith(
        { sub: "user-1", purpose: "2fa-challenge", remember: false },
        { secret: "jwt-secret", expiresIn: "5m" },
      );
    });
  });

  describe("getChallengedUser", () => {
    it("should return user and remember from a valid challenge token", async () => {
      jwtService.verify.mockReturnValue({
        sub: "user-1",
        purpose: "2fa-challenge",
        remember: true,
      });
      userRepository.findById.mockResolvedValue(mockUser);

      const result = await service.getChallengedUser("valid-token");

      expect(result).toEqual({ user: mockUser, remember: true });
      expect(jwtService.verify).toHaveBeenCalledWith("valid-token", { secret: "jwt-secret" });
    });

    it("should default remember to false when not in payload", async () => {
      jwtService.verify.mockReturnValue({
        sub: "user-1",
        purpose: "2fa-challenge",
      });
      userRepository.findById.mockResolvedValue(mockUser);

      const result = await service.getChallengedUser("valid-token");

      expect(result.remember).toBe(false);
    });

    it("should throw UnauthorizedException when token purpose is wrong", async () => {
      jwtService.verify.mockReturnValue({
        sub: "user-1",
        purpose: "something-else",
      });

      await expect(service.getChallengedUser("bad-token")).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it("should throw UnauthorizedException when user is not found", async () => {
      jwtService.verify.mockReturnValue({
        sub: "user-1",
        purpose: "2fa-challenge",
        remember: false,
      });
      userRepository.findById.mockResolvedValue(null);

      await expect(service.getChallengedUser("token")).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it("should throw UnauthorizedException when jwt verify throws", async () => {
      jwtService.verify.mockImplementation(() => {
        throw new Error("jwt expired");
      });

      await expect(service.getChallengedUser("expired-token")).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe("userRequiresTwoFactor", () => {
    it("should return false when user has no twoFactorSecret", () => {
      const result = service.userRequiresTwoFactor(mockUser);
      expect(result).toBe(false);
    });

    it("should return true when user has twoFactorSecret and no confirm option", () => {
      const user = { ...mockUser, twoFactorSecret: "secret" };
      const result = service.userRequiresTwoFactor(user);
      expect(result).toBe(true);
    });

    it("should return true when confirm is enabled and twoFactorConfirmedAt is set", () => {
      options.twoFactorOptions = { confirm: true };
      service = new AuthService(userRepository, options, jwtService);

      const user = { ...mockUser, twoFactorSecret: "secret", twoFactorConfirmedAt: new Date() };
      const result = service.userRequiresTwoFactor(user);
      expect(result).toBe(true);
    });

    it("should return false when confirm is enabled and twoFactorConfirmedAt is null", () => {
      options.twoFactorOptions = { confirm: true };
      service = new AuthService(userRepository, options, jwtService);

      const user = { ...mockUser, twoFactorSecret: "secret", twoFactorConfirmedAt: null };
      const result = service.userRequiresTwoFactor(user);
      expect(result).toBe(false);
    });

    it("should return true when twoFactorOptions exists but confirm is falsy", () => {
      options.twoFactorOptions = { confirm: false };
      service = new AuthService(userRepository, options, jwtService);

      const user = { ...mockUser, twoFactorSecret: "secret" };
      const result = service.userRequiresTwoFactor(user);
      expect(result).toBe(true);
    });

    it("should return true when twoFactorOptions exists with no confirm key", () => {
      options.twoFactorOptions = {};
      service = new AuthService(userRepository, options, jwtService);

      const user = { ...mockUser, twoFactorSecret: "secret" };
      const result = service.userRequiresTwoFactor(user);
      expect(result).toBe(true);
    });
  });
});
