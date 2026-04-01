import { describe, it, expect, beforeEach, vi } from "vitest";
import { PasswordResetController } from "../../src/controllers/password-reset.controller";

describe("PasswordResetController", () => {
  let controller: PasswordResetController;
  let passwordResetService: any;

  beforeEach(() => {
    passwordResetService = {
      sendResetLink: vi.fn(),
      reset: vi.fn(),
    };

    controller = new PasswordResetController(passwordResetService);
  });

  describe("forgotPassword", () => {
    it("should send a reset link and return success message", async () => {
      passwordResetService.sendResetLink.mockResolvedValue(undefined);

      const result = await controller.forgotPassword({ email: "test@example.com" });

      expect(result).toEqual({ message: "If the email exists, a reset link has been sent." });
    });

    it("should call sendResetLink with the provided email", async () => {
      passwordResetService.sendResetLink.mockResolvedValue(undefined);

      await controller.forgotPassword({ email: "user@example.com" });

      expect(passwordResetService.sendResetLink).toHaveBeenCalledWith("user@example.com");
    });

    it("should propagate errors from passwordResetService", async () => {
      passwordResetService.sendResetLink.mockRejectedValue(new Error("Service error"));

      await expect(controller.forgotPassword({ email: "test@example.com" })).rejects.toThrow(
        "Service error",
      );
    });
  });

  describe("resetPassword", () => {
    const resetDto = {
      email: "test@example.com",
      token: "reset-token-123",
      password: "newpassword123",
    };

    it("should reset password and return success message", async () => {
      passwordResetService.reset.mockResolvedValue(undefined);

      const result = await controller.resetPassword(resetDto);

      expect(result).toEqual({ message: "Your password has been reset." });
    });

    it("should call reset with correct parameters", async () => {
      passwordResetService.reset.mockResolvedValue(undefined);

      await controller.resetPassword(resetDto);

      expect(passwordResetService.reset).toHaveBeenCalledWith({
        email: "test@example.com",
        token: "reset-token-123",
        password: "newpassword123",
      });
    });

    it("should propagate errors from passwordResetService.reset", async () => {
      passwordResetService.reset.mockRejectedValue(new Error("Invalid token"));

      await expect(controller.resetPassword(resetDto)).rejects.toThrow("Invalid token");
    });
  });
});
