import { describe, it, expect, beforeEach, vi } from "vitest";
import { UnauthorizedException, UnprocessableEntityException } from "@nestjs/common";
import { EmailVerificationService } from "../../src/services/email-verification.service";
import { AUTH_EVENTS } from "../../src/events";
import { AuthUser } from "../../src/interfaces";

describe("EmailVerificationService", () => {
  let service: EmailVerificationService;
  let userRepository: any;
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

    options = {
      jwtSecret: "test-jwt-secret-key",
      refreshSecret: "refresh-secret",
      encryptionKey: "test-key",
      features: [],
    };

    eventEmitter = {
      emit: vi.fn(),
    };

    service = new EmailVerificationService(userRepository, options, eventEmitter);
  });

  describe("generateVerificationUrl", () => {
    it("should generate verification URL components", () => {
      const result = service.generateVerificationUrl(mockUser);

      expect(result.id).toBe("user-1");
      expect(result.hash).toBeDefined();
      expect(result.signature).toBeDefined();
      expect(result.expires).toBeDefined();
      expect(Number(result.expires)).toBeGreaterThan(Date.now());
    });

    it("should generate consistent hash for same email", () => {
      const result1 = service.generateVerificationUrl(mockUser);
      const result2 = service.generateVerificationUrl(mockUser);
      expect(result1.hash).toBe(result2.hash);
    });
  });

  describe("verify", () => {
    it("should verify user and save emailVerifiedAt when not previously verified", async () => {
      userRepository.save.mockResolvedValue(mockUser);
      const { id, hash, signature, expires } = service.generateVerificationUrl(mockUser);

      await service.verify(mockUser, id, hash, signature, expires);

      expect(userRepository.save).toHaveBeenCalledWith({
        id: "user-1",
        emailVerifiedAt: expect.any(Date),
      });
      expect(eventEmitter.emit).toHaveBeenCalledWith(AUTH_EVENTS.EMAIL_VERIFIED, {
        user: mockUser,
      });
    });

    it("should not save or emit when user is already verified", async () => {
      const verifiedUser = { ...mockUser, emailVerifiedAt: new Date() };
      const { id, hash, signature, expires } = service.generateVerificationUrl(verifiedUser);

      await service.verify(verifiedUser, id, hash, signature, expires);

      expect(userRepository.save).not.toHaveBeenCalled();
      expect(eventEmitter.emit).not.toHaveBeenCalled();
    });

    it("should throw UnauthorizedException when id does not match", async () => {
      const { hash, signature, expires } = service.generateVerificationUrl(mockUser);

      await expect(service.verify(mockUser, "wrong-id", hash, signature, expires)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it("should throw UnprocessableEntityException when link has expired", async () => {
      const { id, hash, signature } = service.generateVerificationUrl(mockUser);
      const expiredTimestamp = String(Date.now() - 1000);

      // We need to compute a valid signature for expired timestamp
      await expect(service.verify(mockUser, id, hash, signature, expiredTimestamp)).rejects.toThrow(
        UnprocessableEntityException,
      );
    });

    it("should throw UnprocessableEntityException when hash is invalid", async () => {
      const { id, signature, expires } = service.generateVerificationUrl(mockUser);
      const badHash = "a".repeat(64);

      await expect(service.verify(mockUser, id, badHash, signature, expires)).rejects.toThrow(
        UnprocessableEntityException,
      );
    });

    it("should throw UnprocessableEntityException when signature is invalid", async () => {
      const { id, hash, expires } = service.generateVerificationUrl(mockUser);
      const badSignature = "b".repeat(64);

      await expect(service.verify(mockUser, id, hash, badSignature, expires)).rejects.toThrow(
        UnprocessableEntityException,
      );
    });

    it("should work without event emitter", async () => {
      service = new EmailVerificationService(userRepository, options, undefined);
      userRepository.save.mockResolvedValue(mockUser);
      const { id, hash, signature, expires } = service.generateVerificationUrl(mockUser);

      await expect(service.verify(mockUser, id, hash, signature, expires)).resolves.not.toThrow();
      expect(userRepository.save).toHaveBeenCalled();
    });

    it("should work with event emitter that has no emit method", async () => {
      service = new EmailVerificationService(userRepository, options, {} as any);
      userRepository.save.mockResolvedValue(mockUser);
      const { id, hash, signature, expires } = service.generateVerificationUrl(mockUser);

      await expect(service.verify(mockUser, id, hash, signature, expires)).resolves.not.toThrow();
    });
  });

  describe("sendVerificationNotification", () => {
    it("should return the same data as generateVerificationUrl", async () => {
      const result = await service.sendVerificationNotification(mockUser);

      expect(result.id).toBe("user-1");
      expect(result.hash).toBeDefined();
      expect(result.signature).toBeDefined();
      expect(result.expires).toBeDefined();
    });
  });
});
