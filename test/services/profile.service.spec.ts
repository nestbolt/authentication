import { describe, it, expect, beforeEach, vi } from "vitest";
import { ProfileService } from "../../src/services/profile.service";
import { AuthUser } from "../../src/interfaces";

describe("ProfileService", () => {
  let service: ProfileService;
  let updater: any;

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

    updater = {
      update: vi.fn(),
    };

    service = new ProfileService(updater);
  });

  describe("update", () => {
    it("should throw when updater is missing", async () => {
      service = new ProfileService(null as any);

      await expect(service.update(mockUser, { name: "New Name" })).rejects.toThrow(
        "Missing provider: UPDATES_USER_PROFILE",
      );
    });

    it("should call updater.update with user and data", async () => {
      updater.update.mockResolvedValue(undefined);

      await service.update(mockUser, { name: "New Name", email: "new@example.com" });

      expect(updater.update).toHaveBeenCalledWith(mockUser, {
        name: "New Name",
        email: "new@example.com",
      });
    });

    it("should propagate errors from updater", async () => {
      updater.update.mockRejectedValue(new Error("Update failed"));

      await expect(service.update(mockUser, { name: "New Name" })).rejects.toThrow(
        "Update failed",
      );
    });
  });
});
