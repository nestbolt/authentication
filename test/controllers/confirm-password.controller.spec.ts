import { describe, it, expect, beforeEach, vi } from "vitest";
import { UnprocessableEntityException } from "@nestjs/common";
import { ConfirmPasswordController } from "../../src/controllers/confirm-password.controller";

describe("ConfirmPasswordController", () => {
  let controller: ConfirmPasswordController;
  let confirmPasswordService: any;

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
    confirmPasswordService = {
      confirm: vi.fn(),
      storeConfirmationTimestamp: vi.fn(),
      isRecentlyConfirmed: vi.fn(),
    };

    controller = new ConfirmPasswordController(confirmPasswordService);
  });

  describe("confirm", () => {
    const confirmDto = { password: "password123" };

    it("should confirm password and return confirmed true", async () => {
      confirmPasswordService.confirm.mockResolvedValue(true);
      confirmPasswordService.storeConfirmationTimestamp.mockResolvedValue(undefined);

      const result = await controller.confirm(mockUser, confirmDto);

      expect(result).toEqual({ confirmed: true });
    });

    it("should store confirmation timestamp after successful confirmation", async () => {
      confirmPasswordService.confirm.mockResolvedValue(true);
      confirmPasswordService.storeConfirmationTimestamp.mockResolvedValue(undefined);

      await controller.confirm(mockUser, confirmDto);

      expect(confirmPasswordService.storeConfirmationTimestamp).toHaveBeenCalledWith(mockUser);
    });

    it("should call confirm with user and password", async () => {
      confirmPasswordService.confirm.mockResolvedValue(true);
      confirmPasswordService.storeConfirmationTimestamp.mockResolvedValue(undefined);

      await controller.confirm(mockUser, confirmDto);

      expect(confirmPasswordService.confirm).toHaveBeenCalledWith(mockUser, "password123");
    });

    it("should throw UnprocessableEntityException when password is incorrect", async () => {
      confirmPasswordService.confirm.mockResolvedValue(false);

      await expect(controller.confirm(mockUser, confirmDto)).rejects.toThrow(
        UnprocessableEntityException,
      );
    });

    it("should throw with correct message when password is incorrect", async () => {
      confirmPasswordService.confirm.mockResolvedValue(false);

      await expect(controller.confirm(mockUser, confirmDto)).rejects.toThrow(
        "The provided password was incorrect.",
      );
    });

    it("should not store confirmation timestamp when password is incorrect", async () => {
      confirmPasswordService.confirm.mockResolvedValue(false);

      await expect(controller.confirm(mockUser, confirmDto)).rejects.toThrow();
      expect(confirmPasswordService.storeConfirmationTimestamp).not.toHaveBeenCalled();
    });
  });

  describe("status", () => {
    it("should return confirmed true when recently confirmed", async () => {
      confirmPasswordService.isRecentlyConfirmed.mockResolvedValue(true);

      const result = await controller.status(mockUser);

      expect(result).toEqual({ confirmed: true });
    });

    it("should return confirmed false when not recently confirmed", async () => {
      confirmPasswordService.isRecentlyConfirmed.mockResolvedValue(false);

      const result = await controller.status(mockUser);

      expect(result).toEqual({ confirmed: false });
    });

    it("should pass undefined timeout when seconds is not provided", async () => {
      confirmPasswordService.isRecentlyConfirmed.mockResolvedValue(true);

      await controller.status(mockUser);

      expect(confirmPasswordService.isRecentlyConfirmed).toHaveBeenCalledWith(mockUser, undefined);
    });

    it("should pass undefined timeout when seconds is undefined", async () => {
      confirmPasswordService.isRecentlyConfirmed.mockResolvedValue(true);

      await controller.status(mockUser, undefined);

      expect(confirmPasswordService.isRecentlyConfirmed).toHaveBeenCalledWith(mockUser, undefined);
    });

    it("should parse seconds parameter and pass as timeout", async () => {
      confirmPasswordService.isRecentlyConfirmed.mockResolvedValue(true);

      await controller.status(mockUser, "300");

      expect(confirmPasswordService.isRecentlyConfirmed).toHaveBeenCalledWith(mockUser, 300);
    });

    it("should parse various numeric strings", async () => {
      confirmPasswordService.isRecentlyConfirmed.mockResolvedValue(false);

      await controller.status(mockUser, "60");

      expect(confirmPasswordService.isRecentlyConfirmed).toHaveBeenCalledWith(mockUser, 60);
    });

    it("should handle NaN from non-numeric seconds string", async () => {
      confirmPasswordService.isRecentlyConfirmed.mockResolvedValue(false);

      await controller.status(mockUser, "not-a-number");

      expect(confirmPasswordService.isRecentlyConfirmed).toHaveBeenCalledWith(mockUser, NaN);
    });
  });
});
