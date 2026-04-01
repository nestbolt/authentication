import { describe, it, expect, beforeEach, vi } from "vitest";
import { PasswordController } from "../../src/controllers/password.controller";

describe("PasswordController", () => {
  let controller: PasswordController;
  let passwordService: any;

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
    passwordService = {
      update: vi.fn(),
    };

    controller = new PasswordController(passwordService);
  });

  describe("update", () => {
    const updateDto = {
      currentPassword: "oldpassword",
      password: "newpassword123",
      passwordConfirmation: "newpassword123",
    };

    it("should update password and return success message", async () => {
      passwordService.update.mockResolvedValue(undefined);

      const result = await controller.update(mockUser, updateDto);

      expect(result).toEqual({ message: "Password updated." });
    });

    it("should call passwordService.update with user and dto", async () => {
      passwordService.update.mockResolvedValue(undefined);

      await controller.update(mockUser, updateDto);

      expect(passwordService.update).toHaveBeenCalledWith(mockUser, updateDto);
    });

    it("should propagate errors from passwordService", async () => {
      passwordService.update.mockRejectedValue(new Error("Password update failed"));

      await expect(controller.update(mockUser, updateDto)).rejects.toThrow("Password update failed");
    });
  });
});
