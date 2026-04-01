import { describe, it, expect, beforeEach, vi } from "vitest";
import { UnprocessableEntityException } from "@nestjs/common";
import { PasswordResetService } from "../../src/services/password-reset.service";
import { AUTH_EVENTS } from "../../src/events";
import * as bcrypt from "bcrypt";
import { AuthUser } from "../../src/interfaces";

vi.mock("bcrypt", () => ({
  hash: vi.fn(),
  compare: vi.fn(),
}));

vi.mock("crypto", async (importOriginal) => {
  const actual = await importOriginal<typeof import("crypto")>();
  return {
    ...actual,
    randomBytes: vi.fn(() => Buffer.from("a".repeat(32))),
  };
});

describe("PasswordResetService", () => {
  let service: PasswordResetService;
  let userRepository: any;
  let resetRepository: any;
  let resetter: any;
  let options: any;
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

    userRepository = {
      findById: vi.fn(),
      findByField: vi.fn(),
      save: vi.fn(),
      create: vi.fn(),
    };

    resetRepository = {
      createToken: vi.fn(),
      findByEmail: vi.fn(),
      deleteByEmail: vi.fn(),
    };

    resetter = {
      reset: vi.fn(),
    };

    options = {
      jwtSecret: "jwt-secret",
      refreshSecret: "refresh-secret",
      encryptionKey: "test-key",
      features: [],
    };

    eventEmitter = {
      emit: vi.fn(),
    };

    service = new PasswordResetService(
      userRepository,
      resetRepository,
      resetter,
      options,
      eventEmitter,
    );
  });

  describe("ensureDependencies (via sendResetLink)", () => {
    it("should throw when resetRepository is missing", async () => {
      service = new PasswordResetService(
        userRepository,
        null as any,
        resetter,
        options,
        eventEmitter,
      );

      await expect(service.sendResetLink("test@example.com")).rejects.toThrow(
        "Missing provider: PASSWORD_RESET_REPOSITORY",
      );
    });

    it("should throw when resetter is missing", async () => {
      service = new PasswordResetService(
        userRepository,
        resetRepository,
        null as any,
        options,
        eventEmitter,
      );

      await expect(service.sendResetLink("test@example.com")).rejects.toThrow(
        "Missing provider: RESETS_USER_PASSWORDS",
      );
    });
  });

  describe("sendResetLink", () => {
    it("should return empty token when user is not found", async () => {
      userRepository.findByField.mockResolvedValue(null);

      const result = await service.sendResetLink("notfound@example.com");

      expect(result).toEqual({ token: "" });
      expect(resetRepository.createToken).not.toHaveBeenCalled();
    });

    it("should generate and store a hashed token when user exists", async () => {
      userRepository.findByField.mockResolvedValue(mockUser);
      (bcrypt.hash as any).mockResolvedValue("hashed-token");

      const result = await service.sendResetLink("test@example.com");

      expect(result.token).toBeDefined();
      expect(result.token.length).toBeGreaterThan(0);
      expect(bcrypt.hash).toHaveBeenCalled();
      expect(resetRepository.createToken).toHaveBeenCalledWith("test@example.com", "hashed-token");
    });

    it("should use default email field when usernameField is not set", async () => {
      userRepository.findByField.mockResolvedValue(mockUser);
      (bcrypt.hash as any).mockResolvedValue("hashed-token");

      await service.sendResetLink("test@example.com");

      expect(userRepository.findByField).toHaveBeenCalledWith("email", "test@example.com");
    });

    it("should use custom usernameField from options", async () => {
      options.usernameField = "username";
      service = new PasswordResetService(
        userRepository,
        resetRepository,
        resetter,
        options,
        eventEmitter,
      );
      userRepository.findByField.mockResolvedValue(mockUser);
      (bcrypt.hash as any).mockResolvedValue("hashed-token");

      await service.sendResetLink("testuser");

      expect(userRepository.findByField).toHaveBeenCalledWith("username", "testuser");
    });
  });

  describe("reset", () => {
    it("should throw when ensureDependencies fails (no resetRepository)", async () => {
      service = new PasswordResetService(
        userRepository,
        null as any,
        resetter,
        options,
        eventEmitter,
      );

      await expect(
        service.reset({ email: "test@example.com", token: "token", password: "new-pass" }),
      ).rejects.toThrow("Missing provider: PASSWORD_RESET_REPOSITORY");
    });

    it("should throw when ensureDependencies fails (no resetter)", async () => {
      service = new PasswordResetService(
        userRepository,
        resetRepository,
        null as any,
        options,
        eventEmitter,
      );

      await expect(
        service.reset({ email: "test@example.com", token: "token", password: "new-pass" }),
      ).rejects.toThrow("Missing provider: RESETS_USER_PASSWORDS");
    });

    it("should throw when no reset record is found", async () => {
      resetRepository.findByEmail.mockResolvedValue(null);

      await expect(
        service.reset({ email: "test@example.com", token: "token", password: "new-pass" }),
      ).rejects.toThrow(UnprocessableEntityException);
    });

    it("should throw when token has expired (> 60 minutes)", async () => {
      resetRepository.findByEmail.mockResolvedValue({
        token: "hashed-token",
        createdAt: new Date(Date.now() - 61 * 60 * 1000),
      });

      await expect(
        service.reset({ email: "test@example.com", token: "token", password: "new-pass" }),
      ).rejects.toThrow("Password reset token has expired.");
    });

    it("should throw when token comparison fails", async () => {
      resetRepository.findByEmail.mockResolvedValue({
        token: "hashed-token",
        createdAt: new Date(),
      });
      (bcrypt.compare as any).mockResolvedValue(false);

      await expect(
        service.reset({ email: "test@example.com", token: "wrong-token", password: "new-pass" }),
      ).rejects.toThrow("Invalid password reset token.");
    });

    it("should throw when user is not found after token validation", async () => {
      resetRepository.findByEmail.mockResolvedValue({
        token: "hashed-token",
        createdAt: new Date(),
      });
      (bcrypt.compare as any).mockResolvedValue(true);
      userRepository.findByField.mockResolvedValue(null);

      await expect(
        service.reset({ email: "notfound@example.com", token: "token", password: "new-pass" }),
      ).rejects.toThrow("Invalid password reset token.");
    });

    it("should reset password, delete token, and emit event on success", async () => {
      resetRepository.findByEmail.mockResolvedValue({
        token: "hashed-token",
        createdAt: new Date(),
      });
      (bcrypt.compare as any).mockResolvedValue(true);
      userRepository.findByField.mockResolvedValue(mockUser);
      resetter.reset.mockResolvedValue(undefined);
      resetRepository.deleteByEmail.mockResolvedValue(undefined);

      await service.reset({
        email: "test@example.com",
        token: "valid-token",
        password: "new-password",
      });

      expect(resetter.reset).toHaveBeenCalledWith(mockUser, "new-password");
      expect(resetRepository.deleteByEmail).toHaveBeenCalledWith("test@example.com");
      expect(eventEmitter.emit).toHaveBeenCalledWith(AUTH_EVENTS.PASSWORD_RESET, {
        user: mockUser,
      });
    });

    it("should work without event emitter", async () => {
      service = new PasswordResetService(
        userRepository,
        resetRepository,
        resetter,
        options,
        undefined,
      );
      resetRepository.findByEmail.mockResolvedValue({
        token: "hashed-token",
        createdAt: new Date(),
      });
      (bcrypt.compare as any).mockResolvedValue(true);
      userRepository.findByField.mockResolvedValue(mockUser);
      resetter.reset.mockResolvedValue(undefined);
      resetRepository.deleteByEmail.mockResolvedValue(undefined);

      await expect(
        service.reset({ email: "test@example.com", token: "token", password: "new-pass" }),
      ).resolves.not.toThrow();
    });

    it("should use custom usernameField for user lookup in reset", async () => {
      options.usernameField = "username";
      service = new PasswordResetService(
        userRepository,
        resetRepository,
        resetter,
        options,
        eventEmitter,
      );
      resetRepository.findByEmail.mockResolvedValue({
        token: "hashed-token",
        createdAt: new Date(),
      });
      (bcrypt.compare as any).mockResolvedValue(true);
      userRepository.findByField.mockResolvedValue(mockUser);
      resetter.reset.mockResolvedValue(undefined);
      resetRepository.deleteByEmail.mockResolvedValue(undefined);

      await service.reset({ email: "test@example.com", token: "token", password: "new-pass" });

      expect(userRepository.findByField).toHaveBeenCalledWith("username", "test@example.com");
    });
  });
});
