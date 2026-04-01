import { describe, it, expect, beforeEach, vi } from "vitest";
import { TwoFactorController } from "../../src/controllers/two-factor.controller";

describe("TwoFactorController", () => {
  let controller: TwoFactorController;
  let twoFactorService: any;

  const mockUser = {
    id: "user-1",
    name: "Test User",
    email: "test@example.com",
    password: "hashed",
    emailVerifiedAt: null,
    twoFactorSecret: "secret",
    twoFactorRecoveryCodes: "codes",
    twoFactorConfirmedAt: new Date(),
    passwordConfirmedAt: new Date(),
  };

  beforeEach(() => {
    twoFactorService = {
      enable: vi.fn(),
      disable: vi.fn(),
      confirmSetup: vi.fn(),
      getQrCode: vi.fn(),
      getSecretKey: vi.fn(),
      getRecoveryCodes: vi.fn(),
      regenerateRecoveryCodes: vi.fn(),
    };

    controller = new TwoFactorController(twoFactorService);
  });

  describe("enable", () => {
    it("should enable 2FA and return success message", async () => {
      twoFactorService.enable.mockResolvedValue(undefined);

      const result = await controller.enable(mockUser, { force: false });

      expect(result).toEqual({ message: "Two-factor authentication enabled." });
    });

    it("should call enable with user and force flag", async () => {
      twoFactorService.enable.mockResolvedValue(undefined);

      await controller.enable(mockUser, { force: true });

      expect(twoFactorService.enable).toHaveBeenCalledWith(mockUser, true);
    });

    it("should default force to false when not provided", async () => {
      twoFactorService.enable.mockResolvedValue(undefined);

      await controller.enable(mockUser, {} as any);

      expect(twoFactorService.enable).toHaveBeenCalledWith(mockUser, false);
    });

    it("should default force to false when body.force is undefined", async () => {
      twoFactorService.enable.mockResolvedValue(undefined);

      await controller.enable(mockUser, { force: undefined } as any);

      expect(twoFactorService.enable).toHaveBeenCalledWith(mockUser, false);
    });

    it("should propagate errors from twoFactorService.enable", async () => {
      twoFactorService.enable.mockRejectedValue(new Error("Enable failed"));

      await expect(controller.enable(mockUser, { force: false })).rejects.toThrow("Enable failed");
    });
  });

  describe("disable", () => {
    it("should disable 2FA and return success message", async () => {
      twoFactorService.disable.mockResolvedValue(undefined);

      const result = await controller.disable(mockUser);

      expect(result).toEqual({ message: "Two-factor authentication disabled." });
    });

    it("should call disable with user", async () => {
      twoFactorService.disable.mockResolvedValue(undefined);

      await controller.disable(mockUser);

      expect(twoFactorService.disable).toHaveBeenCalledWith(mockUser);
    });

    it("should propagate errors from twoFactorService.disable", async () => {
      twoFactorService.disable.mockRejectedValue(new Error("Disable failed"));

      await expect(controller.disable(mockUser)).rejects.toThrow("Disable failed");
    });
  });

  describe("confirm", () => {
    it("should confirm 2FA setup and return success message", async () => {
      twoFactorService.confirmSetup.mockResolvedValue(undefined);

      const result = await controller.confirm(mockUser, { code: "123456" });

      expect(result).toEqual({ message: "Two-factor authentication confirmed." });
    });

    it("should call confirmSetup with user and code", async () => {
      twoFactorService.confirmSetup.mockResolvedValue(undefined);

      await controller.confirm(mockUser, { code: "654321" });

      expect(twoFactorService.confirmSetup).toHaveBeenCalledWith(mockUser, "654321");
    });

    it("should propagate errors from twoFactorService.confirmSetup", async () => {
      twoFactorService.confirmSetup.mockRejectedValue(new Error("Invalid code"));

      await expect(controller.confirm(mockUser, { code: "000000" })).rejects.toThrow(
        "Invalid code",
      );
    });
  });

  describe("qrCode", () => {
    it("should return QR code data", async () => {
      const qrData = { svg: "<svg>...</svg>", url: "otpauth://totp/..." };
      twoFactorService.getQrCode.mockResolvedValue(qrData);

      const result = await controller.qrCode(mockUser);

      expect(result).toEqual(qrData);
    });

    it("should call getQrCode with user", async () => {
      twoFactorService.getQrCode.mockResolvedValue({});

      await controller.qrCode(mockUser);

      expect(twoFactorService.getQrCode).toHaveBeenCalledWith(mockUser);
    });

    it("should propagate errors from twoFactorService.getQrCode", async () => {
      twoFactorService.getQrCode.mockRejectedValue(new Error("QR error"));

      await expect(controller.qrCode(mockUser)).rejects.toThrow("QR error");
    });
  });

  describe("secretKey", () => {
    it("should return secret key data", async () => {
      const secretData = { secretKey: "JBSWY3DPEHPK3PXP" };
      twoFactorService.getSecretKey.mockResolvedValue(secretData);

      const result = await controller.secretKey(mockUser);

      expect(result).toEqual(secretData);
    });

    it("should call getSecretKey with user", async () => {
      twoFactorService.getSecretKey.mockResolvedValue({});

      await controller.secretKey(mockUser);

      expect(twoFactorService.getSecretKey).toHaveBeenCalledWith(mockUser);
    });

    it("should propagate errors from twoFactorService.getSecretKey", async () => {
      twoFactorService.getSecretKey.mockRejectedValue(new Error("Secret error"));

      await expect(controller.secretKey(mockUser)).rejects.toThrow("Secret error");
    });
  });

  describe("getRecoveryCodes", () => {
    it("should return recovery codes", async () => {
      const codes = { recoveryCodes: ["code1", "code2", "code3"] };
      twoFactorService.getRecoveryCodes.mockResolvedValue(codes);

      const result = await controller.getRecoveryCodes(mockUser);

      expect(result).toEqual(codes);
    });

    it("should call getRecoveryCodes with user", async () => {
      twoFactorService.getRecoveryCodes.mockResolvedValue({});

      await controller.getRecoveryCodes(mockUser);

      expect(twoFactorService.getRecoveryCodes).toHaveBeenCalledWith(mockUser);
    });

    it("should propagate errors from twoFactorService.getRecoveryCodes", async () => {
      twoFactorService.getRecoveryCodes.mockRejectedValue(new Error("Codes error"));

      await expect(controller.getRecoveryCodes(mockUser)).rejects.toThrow("Codes error");
    });
  });

  describe("regenerateRecoveryCodes", () => {
    it("should regenerate recovery codes and return success message", async () => {
      twoFactorService.regenerateRecoveryCodes.mockResolvedValue(undefined);

      const result = await controller.regenerateRecoveryCodes(mockUser);

      expect(result).toEqual({ message: "Recovery codes regenerated." });
    });

    it("should call regenerateRecoveryCodes with user", async () => {
      twoFactorService.regenerateRecoveryCodes.mockResolvedValue(undefined);

      await controller.regenerateRecoveryCodes(mockUser);

      expect(twoFactorService.regenerateRecoveryCodes).toHaveBeenCalledWith(mockUser);
    });

    it("should propagate errors from twoFactorService.regenerateRecoveryCodes", async () => {
      twoFactorService.regenerateRecoveryCodes.mockRejectedValue(new Error("Regen error"));

      await expect(controller.regenerateRecoveryCodes(mockUser)).rejects.toThrow("Regen error");
    });
  });
});
