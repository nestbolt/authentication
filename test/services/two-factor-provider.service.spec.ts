import { describe, it, expect, beforeEach, vi } from "vitest";
import { TwoFactorProviderService } from "../../src/services/two-factor-provider.service";
import { authenticator } from "otplib";
import * as qrcode from "qrcode";

vi.mock("otplib", () => ({
  authenticator: {
    options: {},
    generateSecret: vi.fn(),
    keyuri: vi.fn(),
    check: vi.fn(),
  },
}));

vi.mock("qrcode", () => ({
  toString: vi.fn(),
}));

describe("TwoFactorProviderService", () => {
  let service: TwoFactorProviderService;
  let options: any;

  beforeEach(() => {
    vi.clearAllMocks();

    options = {
      jwtSecret: "jwt-secret",
      refreshSecret: "refresh-secret",
      encryptionKey: "test-key",
      features: [],
    };

    service = new TwoFactorProviderService(options);
  });

  describe("constructor", () => {
    it("should set authenticator window option when provided", () => {
      const optionsWithWindow = {
        ...options,
        twoFactorOptions: { window: 2 },
      };
      new TwoFactorProviderService(optionsWithWindow);
      expect(authenticator.options).toEqual({ window: 2 });
    });

    it("should not set authenticator window when not provided", () => {
      // Reset to verify
      authenticator.options = {};
      new TwoFactorProviderService(options);
      // options should remain as-is (not overwritten)
      expect(authenticator.options).toEqual({});
    });

    it("should set window when it is 0", () => {
      const optionsWithZero = {
        ...options,
        twoFactorOptions: { window: 0 },
      };
      new TwoFactorProviderService(optionsWithZero);
      expect(authenticator.options).toEqual({ window: 0 });
    });
  });

  describe("generateSecretKey", () => {
    it("should generate a secret with default length (20)", () => {
      (authenticator.generateSecret as any).mockReturnValue("secret-key");

      const result = service.generateSecretKey();

      expect(result).toBe("secret-key");
      expect(authenticator.generateSecret).toHaveBeenCalledWith(20);
    });

    it("should use custom secretLength from options", () => {
      options.twoFactorOptions = { secretLength: 32 };
      service = new TwoFactorProviderService(options);
      (authenticator.generateSecret as any).mockReturnValue("long-secret");

      const result = service.generateSecretKey();

      expect(result).toBe("long-secret");
      expect(authenticator.generateSecret).toHaveBeenCalledWith(32);
    });
  });

  describe("getQrCodeUrl", () => {
    it("should return the otpauth URL", () => {
      (authenticator.keyuri as any).mockReturnValue("otpauth://totp/MyApp:user@test.com?secret=ABC");

      const result = service.getQrCodeUrl("MyApp", "user@test.com", "ABC");

      expect(result).toBe("otpauth://totp/MyApp:user@test.com?secret=ABC");
      expect(authenticator.keyuri).toHaveBeenCalledWith("user@test.com", "MyApp", "ABC");
    });
  });

  describe("getQrCodeSvg", () => {
    it("should return SVG string from qrcode", async () => {
      (qrcode.toString as any).mockResolvedValue("<svg>qr</svg>");

      const result = await service.getQrCodeSvg("otpauth://totp/...");

      expect(result).toBe("<svg>qr</svg>");
      expect(qrcode.toString).toHaveBeenCalledWith("otpauth://totp/...", { type: "svg" });
    });
  });

  describe("verify", () => {
    it("should return true when authenticator.check returns true", () => {
      (authenticator.check as any).mockReturnValue(true);

      const result = service.verify("secret", "123456");

      expect(result).toBe(true);
      expect(authenticator.check).toHaveBeenCalledWith("123456", "secret");
    });

    it("should return false when authenticator.check returns false", () => {
      (authenticator.check as any).mockReturnValue(false);

      const result = service.verify("secret", "000000");
      expect(result).toBe(false);
    });

    it("should return false when authenticator.check throws", () => {
      (authenticator.check as any).mockImplementation(() => {
        throw new Error("Invalid token");
      });

      const result = service.verify("bad-secret", "123456");
      expect(result).toBe(false);
    });
  });
});
