import { describe, it, expect, beforeEach, vi } from "vitest";
import { ProfileController } from "../../src/controllers/profile.controller";

describe("ProfileController", () => {
  let controller: ProfileController;
  let profileService: any;

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
    profileService = {
      update: vi.fn(),
    };

    controller = new ProfileController(profileService);
  });

  describe("update", () => {
    const updateDto = { name: "Updated Name", email: "updated@example.com" };

    it("should update profile and return success message", async () => {
      profileService.update.mockResolvedValue(undefined);

      const result = await controller.update(mockUser, updateDto);

      expect(result).toEqual({ message: "Profile information updated." });
    });

    it("should call profileService.update with user and dto", async () => {
      profileService.update.mockResolvedValue(undefined);

      await controller.update(mockUser, updateDto);

      expect(profileService.update).toHaveBeenCalledWith(mockUser, updateDto);
    });

    it("should propagate errors from profileService", async () => {
      profileService.update.mockRejectedValue(new Error("Update failed"));

      await expect(controller.update(mockUser, updateDto)).rejects.toThrow("Update failed");
    });
  });
});
