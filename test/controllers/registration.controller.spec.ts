import { describe, it, expect, beforeEach, vi } from "vitest";
import { RegistrationController } from "../../src/controllers/registration.controller";

describe("RegistrationController", () => {
  let controller: RegistrationController;
  let registrationService: any;

  beforeEach(() => {
    registrationService = {
      register: vi.fn(),
    };

    controller = new RegistrationController(registrationService);
  });

  describe("register", () => {
    const registerDto = {
      name: "Test User",
      email: "test@example.com",
      password: "password123",
      passwordConfirmation: "password123",
    };

    it("should register a user and return tokens", async () => {
      registrationService.register.mockResolvedValue({
        accessToken: "access-token",
        refreshToken: "refresh-token",
      });

      const result = await controller.register(registerDto);

      expect(result).toEqual({
        twoFactor: false,
        accessToken: "access-token",
        refreshToken: "refresh-token",
      });
    });

    it("should call registrationService.register with the dto", async () => {
      registrationService.register.mockResolvedValue({
        accessToken: "access",
        refreshToken: "refresh",
      });

      await controller.register(registerDto);

      expect(registrationService.register).toHaveBeenCalledWith(registerDto);
    });

    it("should always set twoFactor to false", async () => {
      registrationService.register.mockResolvedValue({
        accessToken: "access",
        refreshToken: "refresh",
      });

      const result = await controller.register(registerDto);

      expect(result.twoFactor).toBe(false);
    });

    it("should propagate errors from registrationService", async () => {
      registrationService.register.mockRejectedValue(new Error("Registration failed"));

      await expect(controller.register(registerDto)).rejects.toThrow("Registration failed");
    });
  });
});
