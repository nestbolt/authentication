import { describe, it, expect, beforeEach, vi } from "vitest";
import { RegistrationService } from "../../src/services/registration.service";
import { AUTH_EVENTS } from "../../src/events";
import { AuthUser } from "../../src/interfaces";

describe("RegistrationService", () => {
  let service: RegistrationService;
  let creator: any;
  let authService: any;
  let eventEmitter: any;

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

    creator = {
      create: vi.fn(),
    };

    authService = {
      generateTokens: vi.fn(),
    };

    eventEmitter = {
      emit: vi.fn(),
    };

    service = new RegistrationService(creator, authService, eventEmitter);
  });

  describe("register", () => {
    it("should throw when creator is missing", async () => {
      service = new RegistrationService(null as any, authService, eventEmitter);

      await expect(
        service.register({ name: "Test", email: "test@example.com", password: "pass" }),
      ).rejects.toThrow("Missing provider: CREATES_NEW_USERS");
    });

    it("should create user, emit event, generate tokens, and return result", async () => {
      creator.create.mockResolvedValue(mockUser);
      authService.generateTokens.mockResolvedValue({
        accessToken: "access-token",
        refreshToken: "refresh-token",
      });

      const data = { name: "Test", email: "test@example.com", password: "pass" };
      const result = await service.register(data);

      expect(creator.create).toHaveBeenCalledWith(data);
      expect(eventEmitter.emit).toHaveBeenCalledWith(AUTH_EVENTS.REGISTERED, {
        user: mockUser,
      });
      expect(authService.generateTokens).toHaveBeenCalledWith(mockUser);
      expect(result).toEqual({
        user: mockUser,
        accessToken: "access-token",
        refreshToken: "refresh-token",
      });
    });

    it("should work without event emitter", async () => {
      service = new RegistrationService(creator, authService, undefined);
      creator.create.mockResolvedValue(mockUser);
      authService.generateTokens.mockResolvedValue({
        accessToken: "at",
        refreshToken: "rt",
      });

      const result = await service.register({ email: "test@example.com" });

      expect(result.user).toBe(mockUser);
      expect(result.accessToken).toBe("at");
    });

    it("should work with event emitter that has no emit method", async () => {
      service = new RegistrationService(creator, authService, {} as any);
      creator.create.mockResolvedValue(mockUser);
      authService.generateTokens.mockResolvedValue({
        accessToken: "at",
        refreshToken: "rt",
      });

      await expect(service.register({ email: "test@example.com" })).resolves.not.toThrow();
    });
  });
});
