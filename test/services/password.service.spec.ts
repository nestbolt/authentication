import { describe, it, expect, beforeEach, vi } from "vitest";
import { PasswordService } from "../../src/services/password.service";
import { AUTH_EVENTS } from "../../src/events";
import { AuthUser } from "../../src/interfaces";

describe("PasswordService", () => {
  let service: PasswordService;
  let updater: any;
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

    updater = {
      update: vi.fn(),
    };

    eventEmitter = {
      emit: vi.fn(),
    };

    service = new PasswordService(updater, eventEmitter);
  });

  describe("update", () => {
    it("should throw when updater is missing", async () => {
      service = new PasswordService(null as any, eventEmitter);

      await expect(
        service.update(mockUser, { password: "new-pass" }),
      ).rejects.toThrow("Missing provider: UPDATES_USER_PASSWORDS");
    });

    it("should call updater.update and emit event on success", async () => {
      updater.update.mockResolvedValue(undefined);

      await service.update(mockUser, { password: "new-pass", currentPassword: "old-pass" });

      expect(updater.update).toHaveBeenCalledWith(mockUser, {
        password: "new-pass",
        currentPassword: "old-pass",
      });
      expect(eventEmitter.emit).toHaveBeenCalledWith(AUTH_EVENTS.PASSWORD_UPDATED, {
        user: mockUser,
      });
    });

    it("should work without event emitter", async () => {
      service = new PasswordService(updater, undefined);
      updater.update.mockResolvedValue(undefined);

      await expect(service.update(mockUser, { password: "new-pass" })).resolves.not.toThrow();
      expect(updater.update).toHaveBeenCalled();
    });

    it("should work with event emitter that has no emit method", async () => {
      service = new PasswordService(updater, {} as any);
      updater.update.mockResolvedValue(undefined);

      await expect(service.update(mockUser, { password: "new-pass" })).resolves.not.toThrow();
    });
  });
});
