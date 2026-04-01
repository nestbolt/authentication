import { describe, it, expect, beforeEach, vi } from "vitest";
import { NotFoundException, UnprocessableEntityException } from "@nestjs/common";
import { TwoFactorService } from "../../src/services/two-factor.service";
import { AUTH_EVENTS } from "../../src/events";
import { AuthUser } from "../../src/interfaces";

describe("TwoFactorService", () => {
  let service: TwoFactorService;
  let userRepository: any;
  let options: any;
  let twoFactorProvider: any;
  let encryptionService: any;
  let recoveryCodeService: any;
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
      jwtSecret: "jwt-secret",
      refreshSecret: "refresh-secret",
      encryptionKey: "test-key",
      features: [],
    };

    twoFactorProvider = {
      generateSecretKey: vi.fn(),
      getQrCodeUrl: vi.fn(),
      getQrCodeSvg: vi.fn(),
      verify: vi.fn(),
    };

    encryptionService = {
      encrypt: vi.fn(),
      decrypt: vi.fn(),
    };

    recoveryCodeService = {
      generateCode: vi.fn(),
      generateCodes: vi.fn(),
    };

    eventEmitter = {
      emit: vi.fn(),
    };

    service = new TwoFactorService(
      userRepository,
      options,
      twoFactorProvider,
      encryptionService,
      recoveryCodeService,
      eventEmitter,
    );
  });

  describe("enable", () => {
    it("should return early if user already has twoFactorSecret and force is false", async () => {
      const user = { ...mockUser, twoFactorSecret: "existing-secret" };

      await service.enable(user);

      expect(twoFactorProvider.generateSecretKey).not.toHaveBeenCalled();
      expect(userRepository.save).not.toHaveBeenCalled();
    });

    it("should return early if user already has twoFactorSecret and force is not passed", async () => {
      const user = { ...mockUser, twoFactorSecret: "existing-secret" };

      await service.enable(user, false);

      expect(twoFactorProvider.generateSecretKey).not.toHaveBeenCalled();
    });

    it("should re-enable if user has twoFactorSecret but force is true", async () => {
      const user = { ...mockUser, twoFactorSecret: "existing-secret" };
      twoFactorProvider.generateSecretKey.mockReturnValue("new-secret");
      recoveryCodeService.generateCodes.mockReturnValue(["code1", "code2"]);
      encryptionService.encrypt
        .mockReturnValueOnce("encrypted-secret")
        .mockReturnValueOnce("encrypted-codes");
      userRepository.save.mockResolvedValue(user);

      await service.enable(user, true);

      expect(twoFactorProvider.generateSecretKey).toHaveBeenCalled();
      expect(userRepository.save).toHaveBeenCalledWith({
        id: "user-1",
        twoFactorSecret: "encrypted-secret",
        twoFactorRecoveryCodes: "encrypted-codes",
        twoFactorConfirmedAt: null,
      });
      expect(eventEmitter.emit).toHaveBeenCalledWith(AUTH_EVENTS.TWO_FACTOR_ENABLED, { user });
    });

    it("should enable 2FA for user without existing secret", async () => {
      twoFactorProvider.generateSecretKey.mockReturnValue("new-secret");
      recoveryCodeService.generateCodes.mockReturnValue(["c1", "c2", "c3"]);
      encryptionService.encrypt.mockReturnValueOnce("enc-secret").mockReturnValueOnce("enc-codes");
      userRepository.save.mockResolvedValue(mockUser);

      await service.enable(mockUser);

      expect(recoveryCodeService.generateCodes).toHaveBeenCalledWith(8);
      expect(encryptionService.encrypt).toHaveBeenCalledWith("new-secret");
      expect(encryptionService.encrypt).toHaveBeenCalledWith(JSON.stringify(["c1", "c2", "c3"]));
      expect(userRepository.save).toHaveBeenCalled();
      expect(eventEmitter.emit).toHaveBeenCalledWith(AUTH_EVENTS.TWO_FACTOR_ENABLED, {
        user: mockUser,
      });
    });

    it("should work without event emitter", async () => {
      service = new TwoFactorService(
        userRepository,
        options,
        twoFactorProvider,
        encryptionService,
        recoveryCodeService,
        undefined,
      );
      twoFactorProvider.generateSecretKey.mockReturnValue("secret");
      recoveryCodeService.generateCodes.mockReturnValue([]);
      encryptionService.encrypt.mockReturnValue("enc");
      userRepository.save.mockResolvedValue(mockUser);

      await expect(service.enable(mockUser)).resolves.not.toThrow();
    });
  });

  describe("disable", () => {
    it("should return early when user has no 2FA data at all", async () => {
      await service.disable(mockUser);

      expect(userRepository.save).not.toHaveBeenCalled();
      expect(eventEmitter.emit).not.toHaveBeenCalled();
    });

    it("should disable when user has twoFactorSecret", async () => {
      const user = { ...mockUser, twoFactorSecret: "secret" };
      userRepository.save.mockResolvedValue(user);

      await service.disable(user);

      expect(userRepository.save).toHaveBeenCalledWith({
        id: "user-1",
        twoFactorSecret: null,
        twoFactorRecoveryCodes: null,
        twoFactorConfirmedAt: null,
      });
      expect(eventEmitter.emit).toHaveBeenCalledWith(AUTH_EVENTS.TWO_FACTOR_DISABLED, { user });
    });

    it("should disable when user has twoFactorRecoveryCodes", async () => {
      const user = { ...mockUser, twoFactorRecoveryCodes: "codes" };
      userRepository.save.mockResolvedValue(user);

      await service.disable(user);

      expect(userRepository.save).toHaveBeenCalled();
    });

    it("should disable when user has twoFactorConfirmedAt", async () => {
      const user = { ...mockUser, twoFactorConfirmedAt: new Date() };
      userRepository.save.mockResolvedValue(user);

      await service.disable(user);

      expect(userRepository.save).toHaveBeenCalled();
    });

    it("should work without event emitter", async () => {
      service = new TwoFactorService(
        userRepository,
        options,
        twoFactorProvider,
        encryptionService,
        recoveryCodeService,
        undefined,
      );
      const user = { ...mockUser, twoFactorSecret: "secret" };
      userRepository.save.mockResolvedValue(user);

      await expect(service.disable(user)).resolves.not.toThrow();
    });
  });

  describe("confirmSetup", () => {
    it("should throw when user has no twoFactorSecret", async () => {
      await expect(service.confirmSetup(mockUser, "123456")).rejects.toThrow(
        UnprocessableEntityException,
      );
    });

    it("should throw when code is empty", async () => {
      const user = { ...mockUser, twoFactorSecret: "encrypted-secret" };

      await expect(service.confirmSetup(user, "")).rejects.toThrow(UnprocessableEntityException);
    });

    it("should throw when code is invalid", async () => {
      const user = { ...mockUser, twoFactorSecret: "encrypted-secret" };
      encryptionService.decrypt.mockReturnValue("decrypted-secret");
      twoFactorProvider.verify.mockReturnValue(false);

      await expect(service.confirmSetup(user, "000000")).rejects.toThrow(
        "The provided two-factor code was invalid.",
      );
    });

    it("should confirm setup when code is valid", async () => {
      const user = { ...mockUser, twoFactorSecret: "encrypted-secret" };
      encryptionService.decrypt.mockReturnValue("decrypted-secret");
      twoFactorProvider.verify.mockReturnValue(true);
      userRepository.save.mockResolvedValue(user);

      await service.confirmSetup(user, "123456");

      expect(encryptionService.decrypt).toHaveBeenCalledWith("encrypted-secret");
      expect(twoFactorProvider.verify).toHaveBeenCalledWith("decrypted-secret", "123456");
      expect(userRepository.save).toHaveBeenCalledWith({
        id: "user-1",
        twoFactorConfirmedAt: expect.any(Date),
      });
      expect(eventEmitter.emit).toHaveBeenCalledWith(AUTH_EVENTS.TWO_FACTOR_CONFIRMED, { user });
    });

    it("should work without event emitter", async () => {
      service = new TwoFactorService(
        userRepository,
        options,
        twoFactorProvider,
        encryptionService,
        recoveryCodeService,
        undefined,
      );
      const user = { ...mockUser, twoFactorSecret: "enc" };
      encryptionService.decrypt.mockReturnValue("secret");
      twoFactorProvider.verify.mockReturnValue(true);
      userRepository.save.mockResolvedValue(user);

      await expect(service.confirmSetup(user, "123456")).resolves.not.toThrow();
    });
  });

  describe("validateCode", () => {
    it("should return false when user has no twoFactorSecret", async () => {
      const result = await service.validateCode(mockUser, "123456");
      expect(result).toBe(false);
    });

    it("should return true when code is valid", async () => {
      const user = { ...mockUser, twoFactorSecret: "encrypted" };
      encryptionService.decrypt.mockReturnValue("secret");
      twoFactorProvider.verify.mockReturnValue(true);

      const result = await service.validateCode(user, "123456");

      expect(result).toBe(true);
      expect(encryptionService.decrypt).toHaveBeenCalledWith("encrypted");
      expect(twoFactorProvider.verify).toHaveBeenCalledWith("secret", "123456");
    });

    it("should return false when code is invalid", async () => {
      const user = { ...mockUser, twoFactorSecret: "encrypted" };
      encryptionService.decrypt.mockReturnValue("secret");
      twoFactorProvider.verify.mockReturnValue(false);

      const result = await service.validateCode(user, "000000");
      expect(result).toBe(false);
    });
  });

  describe("validateRecoveryCode", () => {
    it("should return false when user has no twoFactorRecoveryCodes", async () => {
      const result = await service.validateRecoveryCode(mockUser, "code");
      expect(result).toBe(false);
    });

    it("should return false when code does not match any recovery code", async () => {
      const user = { ...mockUser, twoFactorRecoveryCodes: "encrypted-codes" };
      encryptionService.decrypt.mockReturnValue(JSON.stringify(["code1-code1", "code2-code2"]));

      const result = await service.validateRecoveryCode(user, "wrong-code");
      expect(result).toBe(false);
    });

    it("should return true and replace code when match found", async () => {
      const codes = ["aaaaaaaaaa-aaaaaaaaaa", "bbbbbbbbbb-bbbbbbbbbb"];
      const user = { ...mockUser, twoFactorRecoveryCodes: "encrypted-codes" };
      encryptionService.decrypt.mockReturnValue(JSON.stringify(codes));
      recoveryCodeService.generateCode.mockReturnValue("newcode1234-newcode5678");
      encryptionService.encrypt.mockReturnValue("new-encrypted-codes");
      userRepository.save.mockResolvedValue(user);

      const result = await service.validateRecoveryCode(user, "aaaaaaaaaa-aaaaaaaaaa");

      expect(result).toBe(true);
      expect(recoveryCodeService.generateCode).toHaveBeenCalled();
      expect(encryptionService.encrypt).toHaveBeenCalledWith(
        JSON.stringify(["newcode1234-newcode5678", "bbbbbbbbbb-bbbbbbbbbb"]),
      );
      expect(userRepository.save).toHaveBeenCalledWith({
        id: "user-1",
        twoFactorRecoveryCodes: "new-encrypted-codes",
      });
      expect(eventEmitter.emit).toHaveBeenCalledWith(AUTH_EVENTS.RECOVERY_CODE_REPLACED, {
        user,
        code: "aaaaaaaaaa-aaaaaaaaaa",
      });
    });

    it("should return false when code length differs from stored codes", async () => {
      const codes = ["aaaaaaaaaa-aaaaaaaaaa"];
      const user = { ...mockUser, twoFactorRecoveryCodes: "encrypted-codes" };
      encryptionService.decrypt.mockReturnValue(JSON.stringify(codes));

      const result = await service.validateRecoveryCode(user, "short");
      expect(result).toBe(false);
    });

    it("should handle decryption failure gracefully (returns false)", async () => {
      const user = { ...mockUser, twoFactorRecoveryCodes: "bad-encrypted" };
      encryptionService.decrypt.mockImplementation(() => {
        throw new Error("Decryption failed");
      });

      const result = await service.validateRecoveryCode(user, "code");
      expect(result).toBe(false);
    });

    it("should handle malformed JSON gracefully (returns false)", async () => {
      const user = { ...mockUser, twoFactorRecoveryCodes: "encrypted-bad-json" };
      encryptionService.decrypt.mockReturnValue("not-json");

      const result = await service.validateRecoveryCode(user, "code");
      expect(result).toBe(false);
    });
  });

  describe("getQrCode", () => {
    it("should throw NotFoundException when user has no twoFactorSecret", async () => {
      await expect(service.getQrCode(mockUser)).rejects.toThrow(NotFoundException);
    });

    it("should return svg and url for user with 2FA", async () => {
      const user = { ...mockUser, twoFactorSecret: "encrypted-secret" };
      encryptionService.decrypt.mockReturnValue("plain-secret");
      twoFactorProvider.getQrCodeUrl.mockReturnValue("otpauth://totp/...");
      twoFactorProvider.getQrCodeSvg.mockResolvedValue("<svg>...</svg>");

      const result = await service.getQrCode(user);

      expect(result).toEqual({ svg: "<svg>...</svg>", url: "otpauth://totp/..." });
      expect(twoFactorProvider.getQrCodeUrl).toHaveBeenCalledWith(
        "NestBolt",
        "test@example.com",
        "plain-secret",
      );
    });

    it("should use custom appName from options", async () => {
      options.appName = "MyApp";
      service = new TwoFactorService(
        userRepository,
        options,
        twoFactorProvider,
        encryptionService,
        recoveryCodeService,
        eventEmitter,
      );
      const user = { ...mockUser, twoFactorSecret: "encrypted-secret" };
      encryptionService.decrypt.mockReturnValue("secret");
      twoFactorProvider.getQrCodeUrl.mockReturnValue("url");
      twoFactorProvider.getQrCodeSvg.mockResolvedValue("svg");

      await service.getQrCode(user);

      expect(twoFactorProvider.getQrCodeUrl).toHaveBeenCalledWith(
        "MyApp",
        "test@example.com",
        "secret",
      );
    });
  });

  describe("getSecretKey", () => {
    it("should throw NotFoundException when user has no twoFactorSecret", async () => {
      await expect(service.getSecretKey(mockUser)).rejects.toThrow(NotFoundException);
    });

    it("should return decrypted secret key", async () => {
      const user = { ...mockUser, twoFactorSecret: "encrypted-secret" };
      encryptionService.decrypt.mockReturnValue("plain-secret");

      const result = await service.getSecretKey(user);

      expect(result).toEqual({ secretKey: "plain-secret" });
    });
  });

  describe("getRecoveryCodes", () => {
    it("should return empty array when user has no twoFactorSecret", async () => {
      const result = await service.getRecoveryCodes(mockUser);
      expect(result).toEqual([]);
    });

    it("should return empty array when user has no twoFactorRecoveryCodes", async () => {
      const user = { ...mockUser, twoFactorSecret: "secret" };
      const result = await service.getRecoveryCodes(user);
      expect(result).toEqual([]);
    });

    it("should return decrypted recovery codes", async () => {
      const codes = ["code1", "code2", "code3"];
      const user = {
        ...mockUser,
        twoFactorSecret: "secret",
        twoFactorRecoveryCodes: "encrypted-codes",
      };
      encryptionService.decrypt.mockReturnValue(JSON.stringify(codes));

      const result = await service.getRecoveryCodes(user);
      expect(result).toEqual(codes);
    });

    it("should return empty array when decryption fails", async () => {
      const user = {
        ...mockUser,
        twoFactorSecret: "secret",
        twoFactorRecoveryCodes: "bad-data",
      };
      encryptionService.decrypt.mockImplementation(() => {
        throw new Error("fail");
      });

      const result = await service.getRecoveryCodes(user);
      expect(result).toEqual([]);
    });

    it("should return empty array when JSON parse fails", async () => {
      const user = {
        ...mockUser,
        twoFactorSecret: "secret",
        twoFactorRecoveryCodes: "encrypted",
      };
      encryptionService.decrypt.mockReturnValue("not-json");

      const result = await service.getRecoveryCodes(user);
      expect(result).toEqual([]);
    });

    it("should return empty array from getDecryptedRecoveryCodes when twoFactorRecoveryCodes is null (via getter)", async () => {
      let callCount = 0;
      const user = {
        ...mockUser,
        twoFactorSecret: "secret",
        get twoFactorRecoveryCodes(): string | null {
          callCount++;
          // First call (from getRecoveryCodes check) returns truthy
          // Second call (from getDecryptedRecoveryCodes check) returns null
          return callCount <= 1 ? "encrypted" : null;
        },
      };

      const result = await service.getRecoveryCodes(user as any);
      expect(result).toEqual([]);
    });
  });

  describe("regenerateRecoveryCodes", () => {
    it("should generate new codes and save them encrypted", async () => {
      const codes = ["new1", "new2"];
      recoveryCodeService.generateCodes.mockReturnValue(codes);
      encryptionService.encrypt.mockReturnValue("encrypted-new-codes");
      userRepository.save.mockResolvedValue(mockUser);

      await service.regenerateRecoveryCodes(mockUser);

      expect(recoveryCodeService.generateCodes).toHaveBeenCalledWith(8);
      expect(encryptionService.encrypt).toHaveBeenCalledWith(JSON.stringify(codes));
      expect(userRepository.save).toHaveBeenCalledWith({
        id: "user-1",
        twoFactorRecoveryCodes: "encrypted-new-codes",
      });
      expect(eventEmitter.emit).toHaveBeenCalledWith(AUTH_EVENTS.RECOVERY_CODES_GENERATED, {
        user: mockUser,
      });
    });

    it("should work without event emitter", async () => {
      service = new TwoFactorService(
        userRepository,
        options,
        twoFactorProvider,
        encryptionService,
        recoveryCodeService,
        undefined,
      );
      recoveryCodeService.generateCodes.mockReturnValue([]);
      encryptionService.encrypt.mockReturnValue("enc");
      userRepository.save.mockResolvedValue(mockUser);

      await expect(service.regenerateRecoveryCodes(mockUser)).resolves.not.toThrow();
    });
  });
});
