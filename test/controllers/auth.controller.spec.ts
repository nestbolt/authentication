import { describe, it, expect, beforeEach, vi } from "vitest";
import { UnauthorizedException } from "@nestjs/common";
import { AuthController } from "../../src/controllers/auth.controller";
import { Feature } from "../../src/interfaces";
import { AUTH_EVENTS } from "../../src/events";

describe("AuthController", () => {
  let controller: AuthController;
  let authService: any;
  let loginThrottleGuard: any;
  let options: any;
  let eventEmitter: any;

  const mockUser = {
    id: "user-1",
    name: "Test User",
    email: "test@example.com",
    password: "hashed",
    emailVerifiedAt: null,
    twoFactorSecret: null,
    twoFactorRecoveryCodes: null,
    twoFactorConfirmedAt: null,
    passwordConfirmedAt: null,
  };

  beforeEach(() => {
    authService = {
      validateCredentials: vi.fn(),
      generateTokens: vi.fn(),
      userRequiresTwoFactor: vi.fn(),
      createTwoFactorChallenge: vi.fn(),
    };

    loginThrottleGuard = {
      increment: vi.fn(),
      clear: vi.fn(),
    };

    options = {
      features: [],
      jwtSecret: "test",
      refreshSecret: "test",
      encryptionKey: "test",
      userRepository: class {} as any,
    };

    eventEmitter = {
      emit: vi.fn(),
    };

    controller = new AuthController(authService, loginThrottleGuard, options, eventEmitter);
  });

  describe("login", () => {
    const loginDto = { email: "test@example.com", password: "password123" } as any;
    const request = { body: { email: "test@example.com" }, ip: "127.0.0.1" };

    it("should throw UnauthorizedException when credentials are invalid", async () => {
      authService.validateCredentials.mockResolvedValue(null);

      await expect(controller.login(loginDto, request)).rejects.toThrow(UnauthorizedException);
      expect(loginThrottleGuard.increment).toHaveBeenCalledWith(request);
    });

    it("should throw UnauthorizedException with correct message when credentials are invalid", async () => {
      authService.validateCredentials.mockResolvedValue(null);

      await expect(controller.login(loginDto, request)).rejects.toThrow("Invalid credentials.");
    });

    it("should return tokens on successful login without 2FA", async () => {
      authService.validateCredentials.mockResolvedValue(mockUser);
      authService.generateTokens.mockResolvedValue({
        accessToken: "access",
        refreshToken: "refresh",
      });

      const result = await controller.login(loginDto, request);

      expect(loginThrottleGuard.clear).toHaveBeenCalledWith(request);
      expect(result).toEqual({
        twoFactor: false,
        accessToken: "access",
        refreshToken: "refresh",
      });
    });

    it("should emit LOGIN event on successful login", async () => {
      authService.validateCredentials.mockResolvedValue(mockUser);
      authService.generateTokens.mockResolvedValue({
        accessToken: "access",
        refreshToken: "refresh",
      });

      await controller.login(loginDto, request);

      expect(eventEmitter.emit).toHaveBeenCalledWith(AUTH_EVENTS.LOGIN, { user: mockUser });
    });

    it("should use default usernameField (email) when not configured", async () => {
      authService.validateCredentials.mockResolvedValue(null);

      await expect(controller.login(loginDto, request)).rejects.toThrow();
      expect(authService.validateCredentials).toHaveBeenCalledWith(
        "test@example.com",
        "password123",
      );
    });

    it("should use custom usernameField when configured", async () => {
      options.usernameField = "username";
      controller = new AuthController(authService, loginThrottleGuard, options, eventEmitter);

      const customDto = { username: "myuser", password: "password123" } as any;
      authService.validateCredentials.mockResolvedValue(null);

      await expect(controller.login(customDto, request)).rejects.toThrow();
      expect(authService.validateCredentials).toHaveBeenCalledWith("myuser", "password123");
    });

    it("should return two-factor challenge when 2FA is required", async () => {
      options.features = [Feature.TWO_FACTOR_AUTHENTICATION];
      controller = new AuthController(authService, loginThrottleGuard, options, eventEmitter);

      authService.validateCredentials.mockResolvedValue(mockUser);
      authService.userRequiresTwoFactor.mockReturnValue(true);
      authService.createTwoFactorChallenge.mockResolvedValue("challenge-token-123");

      const result = await controller.login(loginDto, request);

      expect(result).toEqual({
        twoFactor: true,
        challengeToken: "challenge-token-123",
      });
    });

    it("should emit TWO_FACTOR_CHALLENGED event when 2FA is triggered", async () => {
      options.features = [Feature.TWO_FACTOR_AUTHENTICATION];
      controller = new AuthController(authService, loginThrottleGuard, options, eventEmitter);

      authService.validateCredentials.mockResolvedValue(mockUser);
      authService.userRequiresTwoFactor.mockReturnValue(true);
      authService.createTwoFactorChallenge.mockResolvedValue("challenge-token-123");

      await controller.login(loginDto, request);

      expect(eventEmitter.emit).toHaveBeenCalledWith(AUTH_EVENTS.TWO_FACTOR_CHALLENGED, {
        user: mockUser,
      });
    });

    it("should use remember value from loginDto when creating 2FA challenge", async () => {
      options.features = [Feature.TWO_FACTOR_AUTHENTICATION];
      controller = new AuthController(authService, loginThrottleGuard, options, eventEmitter);

      const dtoWithRemember = {
        email: "test@example.com",
        password: "password123",
        remember: true,
      } as any;
      authService.validateCredentials.mockResolvedValue(mockUser);
      authService.userRequiresTwoFactor.mockReturnValue(true);
      authService.createTwoFactorChallenge.mockResolvedValue("challenge-token");

      await controller.login(dtoWithRemember, request);

      expect(authService.createTwoFactorChallenge).toHaveBeenCalledWith(mockUser, true);
    });

    it("should default remember to false when not provided in loginDto for 2FA", async () => {
      options.features = [Feature.TWO_FACTOR_AUTHENTICATION];
      controller = new AuthController(authService, loginThrottleGuard, options, eventEmitter);

      const dtoNoRemember = { email: "test@example.com", password: "password123" } as any;
      authService.validateCredentials.mockResolvedValue(mockUser);
      authService.userRequiresTwoFactor.mockReturnValue(true);
      authService.createTwoFactorChallenge.mockResolvedValue("challenge-token");

      await controller.login(dtoNoRemember, request);

      expect(authService.createTwoFactorChallenge).toHaveBeenCalledWith(mockUser, false);
    });

    it("should proceed with normal login when 2FA feature is enabled but user does not require 2FA", async () => {
      options.features = [Feature.TWO_FACTOR_AUTHENTICATION];
      controller = new AuthController(authService, loginThrottleGuard, options, eventEmitter);

      authService.validateCredentials.mockResolvedValue(mockUser);
      authService.userRequiresTwoFactor.mockReturnValue(false);
      authService.generateTokens.mockResolvedValue({
        accessToken: "access",
        refreshToken: "refresh",
      });

      const result = await controller.login(loginDto, request);

      expect(result).toEqual({
        twoFactor: false,
        accessToken: "access",
        refreshToken: "refresh",
      });
    });

    it("should skip 2FA check when TWO_FACTOR_AUTHENTICATION feature is not enabled", async () => {
      options.features = [Feature.REGISTRATION];
      controller = new AuthController(authService, loginThrottleGuard, options, eventEmitter);

      authService.validateCredentials.mockResolvedValue(mockUser);
      authService.generateTokens.mockResolvedValue({
        accessToken: "access",
        refreshToken: "refresh",
      });

      const result = await controller.login(loginDto, request);

      expect(authService.userRequiresTwoFactor).not.toHaveBeenCalled();
      expect(result.twoFactor).toBe(false);
    });
  });

  describe("login without eventEmitter", () => {
    it("should work without eventEmitter on successful login", async () => {
      controller = new AuthController(authService, loginThrottleGuard, options, undefined);

      const loginDto = { email: "test@example.com", password: "password123" } as any;
      const request = { body: { email: "test@example.com" }, ip: "127.0.0.1" };

      authService.validateCredentials.mockResolvedValue(mockUser);
      authService.generateTokens.mockResolvedValue({
        accessToken: "access",
        refreshToken: "refresh",
      });

      const result = await controller.login(loginDto, request);
      expect(result.twoFactor).toBe(false);
    });

    it("should work without eventEmitter on 2FA challenge", async () => {
      options.features = [Feature.TWO_FACTOR_AUTHENTICATION];
      controller = new AuthController(authService, loginThrottleGuard, options, undefined);

      const loginDto = { email: "test@example.com", password: "password123" } as any;
      const request = { body: { email: "test@example.com" }, ip: "127.0.0.1" };

      authService.validateCredentials.mockResolvedValue(mockUser);
      authService.userRequiresTwoFactor.mockReturnValue(true);
      authService.createTwoFactorChallenge.mockResolvedValue("token");

      const result = await controller.login(loginDto, request);
      expect(result.twoFactor).toBe(true);
    });

    it("should work with eventEmitter that has no emit method", async () => {
      controller = new AuthController(authService, loginThrottleGuard, options, {} as any);

      const loginDto = { email: "test@example.com", password: "password123" } as any;
      const request = { body: { email: "test@example.com" }, ip: "127.0.0.1" };

      authService.validateCredentials.mockResolvedValue(mockUser);
      authService.generateTokens.mockResolvedValue({
        accessToken: "access",
        refreshToken: "refresh",
      });

      const result = await controller.login(loginDto, request);
      expect(result.twoFactor).toBe(false);
    });
  });

  describe("refresh", () => {
    it("should return new tokens", async () => {
      authService.generateTokens.mockResolvedValue({
        accessToken: "new-access",
        refreshToken: "new-refresh",
      });

      const request = { user: mockUser };
      const result = await controller.refresh(request);

      expect(result).toEqual({
        accessToken: "new-access",
        refreshToken: "new-refresh",
      });
      expect(authService.generateTokens).toHaveBeenCalledWith(mockUser);
    });
  });

  describe("logout", () => {
    it("should return success message", async () => {
      const result = await controller.logout(mockUser);

      expect(result).toEqual({ message: "Logged out successfully." });
    });

    it("should emit LOGOUT event", async () => {
      await controller.logout(mockUser);

      expect(eventEmitter.emit).toHaveBeenCalledWith(AUTH_EVENTS.LOGOUT, { user: mockUser });
    });

    it("should work without eventEmitter", async () => {
      controller = new AuthController(authService, loginThrottleGuard, options, undefined);

      const result = await controller.logout(mockUser);
      expect(result).toEqual({ message: "Logged out successfully." });
    });

    it("should work with eventEmitter that has no emit method", async () => {
      controller = new AuthController(authService, loginThrottleGuard, options, {} as any);

      const result = await controller.logout(mockUser);
      expect(result).toEqual({ message: "Logged out successfully." });
    });
  });
});
