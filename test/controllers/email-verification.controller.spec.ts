import { describe, it, expect, beforeEach, vi } from "vitest";
import { BadRequestException } from "@nestjs/common";
import { EmailVerificationController } from "../../src/controllers/email-verification.controller";

describe("EmailVerificationController", () => {
  let controller: EmailVerificationController;
  let emailVerificationService: any;

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
    emailVerificationService = {
      verify: vi.fn(),
      sendVerificationNotification: vi.fn(),
    };

    controller = new EmailVerificationController(emailVerificationService);
  });

  describe("verify", () => {
    it("should verify email and return success message", async () => {
      emailVerificationService.verify.mockResolvedValue(undefined);

      const result = await controller.verify("user-1", "hash123", "sig456", "1234567890", mockUser);

      expect(result).toEqual({ message: "Email verified successfully." });
    });

    it("should call verify with correct parameters", async () => {
      emailVerificationService.verify.mockResolvedValue(undefined);

      await controller.verify("user-1", "hash123", "sig456", "9999999999", mockUser);

      expect(emailVerificationService.verify).toHaveBeenCalledWith(
        mockUser,
        "user-1",
        "hash123",
        "sig456",
        "9999999999",
      );
    });

    it("should throw BadRequestException when signature is missing", async () => {
      await expect(
        controller.verify("user-1", "hash123", undefined, "1234567890", mockUser),
      ).rejects.toThrow(BadRequestException);
    });

    it("should throw BadRequestException when expires is missing", async () => {
      await expect(
        controller.verify("user-1", "hash123", "sig456", undefined, mockUser),
      ).rejects.toThrow(BadRequestException);
    });

    it("should throw BadRequestException when both signature and expires are missing", async () => {
      await expect(
        controller.verify("user-1", "hash123", undefined, undefined, mockUser),
      ).rejects.toThrow(BadRequestException);
    });

    it("should throw BadRequestException with correct message", async () => {
      await expect(
        controller.verify("user-1", "hash123", undefined, "1234567890", mockUser),
      ).rejects.toThrow("Missing signature or expires parameter.");
    });

    it("should throw BadRequestException when user is missing", async () => {
      await expect(
        controller.verify("user-1", "hash123", "sig456", "1234567890", undefined),
      ).rejects.toThrow(BadRequestException);
    });

    it("should throw correct message when user is missing", async () => {
      await expect(
        controller.verify("user-1", "hash123", "sig456", "1234567890", undefined),
      ).rejects.toThrow("User not found.");
    });

    it("should propagate errors from emailVerificationService", async () => {
      emailVerificationService.verify.mockRejectedValue(new Error("Verification failed"));

      await expect(
        controller.verify("user-1", "hash123", "sig456", "1234567890", mockUser),
      ).rejects.toThrow("Verification failed");
    });
  });

  describe("resend", () => {
    it("should return already verified message when email is already verified", async () => {
      const verifiedUser = { ...mockUser, emailVerifiedAt: new Date() };

      const result = await controller.resend(verifiedUser);

      expect(result).toEqual({ message: "Email already verified." });
      expect(emailVerificationService.sendVerificationNotification).not.toHaveBeenCalled();
    });

    it("should send verification notification and return success message", async () => {
      emailVerificationService.sendVerificationNotification.mockResolvedValue({
        verificationUrl: "https://example.com/verify",
      });

      const result = await controller.resend(mockUser);

      expect(result).toEqual({
        message: "Verification link sent.",
        verificationUrl: "https://example.com/verify",
      });
    });

    it("should call sendVerificationNotification with the user", async () => {
      emailVerificationService.sendVerificationNotification.mockResolvedValue({});

      await controller.resend(mockUser);

      expect(emailVerificationService.sendVerificationNotification).toHaveBeenCalledWith(mockUser);
    });

    it("should handle empty verification data from service", async () => {
      emailVerificationService.sendVerificationNotification.mockResolvedValue({});

      const result = await controller.resend(mockUser);

      expect(result).toEqual({ message: "Verification link sent." });
    });

    it("should propagate errors from sendVerificationNotification", async () => {
      emailVerificationService.sendVerificationNotification.mockRejectedValue(
        new Error("Send failed"),
      );

      await expect(controller.resend(mockUser)).rejects.toThrow("Send failed");
    });
  });
});
