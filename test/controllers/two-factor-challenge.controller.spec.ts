import { describe, it, expect, beforeEach, vi } from "vitest";
import { BadRequestException, UnprocessableEntityException } from "@nestjs/common";
import { TwoFactorChallengeController } from "../../src/controllers/two-factor-challenge.controller";
import { AUTH_EVENTS } from "../../src/events";

describe("TwoFactorChallengeController", () => {
  let controller: TwoFactorChallengeController;
  let authService: any;
  let twoFactorService: any;
  let throttleGuard: any;
  let eventEmitter: any;

  const mockUser = {
    id: "user-1",
    name: "Test User",
    email: "test@example.com",
    password: "hashed",
    emailVerifiedAt: null,
    twoFactorSecret: "secret",
    twoFactorRecoveryCodes: "codes",
    twoFactorConfirmedAt: new Date(),
    passwordConfirmedAt: null,
  };

  const mockRequest = { body: {}, ip: "127.0.0.1" };

  beforeEach(() => {
    authService = {
      getChallengedUser: vi.fn(),
      generateTokens: vi.fn(),
    };

    twoFactorService = {
      validateRecoveryCode: vi.fn(),
      validateCode: vi.fn(),
    };

    throttleGuard = {
      increment: vi.fn(),
      clear: vi.fn(),
    };

    eventEmitter = {
      emit: vi.fn(),
    };

    controller = new TwoFactorChallengeController(
      authService,
      twoFactorService,
      throttleGuard,
      eventEmitter,
    );
  });

  describe("challenge with valid code", () => {
    it("should return tokens when code is valid", async () => {
      authService.getChallengedUser.mockResolvedValue({ user: mockUser });
      twoFactorService.validateCode.mockResolvedValue(true);
      authService.generateTokens.mockResolvedValue({
        accessToken: "access",
        refreshToken: "refresh",
      });

      const dto = { challengeToken: "challenge-token", code: "123456" };
      const result = await controller.challenge(dto, mockRequest);

      expect(result).toEqual({
        twoFactor: false,
        accessToken: "access",
        refreshToken: "refresh",
      });
    });

    it("should clear throttle on valid code", async () => {
      authService.getChallengedUser.mockResolvedValue({ user: mockUser });
      twoFactorService.validateCode.mockResolvedValue(true);
      authService.generateTokens.mockResolvedValue({
        accessToken: "access",
        refreshToken: "refresh",
      });

      const dto = { challengeToken: "challenge-token", code: "123456" };
      await controller.challenge(dto, mockRequest);

      expect(throttleGuard.clear).toHaveBeenCalledWith(mockRequest);
    });

    it("should emit VALID_TWO_FACTOR_CODE event on valid code", async () => {
      authService.getChallengedUser.mockResolvedValue({ user: mockUser });
      twoFactorService.validateCode.mockResolvedValue(true);
      authService.generateTokens.mockResolvedValue({
        accessToken: "access",
        refreshToken: "refresh",
      });

      const dto = { challengeToken: "challenge-token", code: "123456" };
      await controller.challenge(dto, mockRequest);

      expect(eventEmitter.emit).toHaveBeenCalledWith(AUTH_EVENTS.VALID_TWO_FACTOR_CODE, {
        user: mockUser,
      });
    });

    it("should call getChallengedUser with challenge token", async () => {
      authService.getChallengedUser.mockResolvedValue({ user: mockUser });
      twoFactorService.validateCode.mockResolvedValue(true);
      authService.generateTokens.mockResolvedValue({
        accessToken: "access",
        refreshToken: "refresh",
      });

      const dto = { challengeToken: "my-challenge-token", code: "123456" };
      await controller.challenge(dto, mockRequest);

      expect(authService.getChallengedUser).toHaveBeenCalledWith("my-challenge-token");
    });
  });

  describe("challenge with invalid code", () => {
    it("should throw UnprocessableEntityException when code is invalid", async () => {
      authService.getChallengedUser.mockResolvedValue({ user: mockUser });
      twoFactorService.validateCode.mockResolvedValue(false);

      const dto = { challengeToken: "challenge-token", code: "wrong-code" };

      await expect(controller.challenge(dto, mockRequest)).rejects.toThrow(
        UnprocessableEntityException,
      );
    });

    it("should throw with correct message when code is invalid", async () => {
      authService.getChallengedUser.mockResolvedValue({ user: mockUser });
      twoFactorService.validateCode.mockResolvedValue(false);

      const dto = { challengeToken: "challenge-token", code: "wrong-code" };

      await expect(controller.challenge(dto, mockRequest)).rejects.toThrow(
        "The provided two-factor code was invalid.",
      );
    });

    it("should increment throttle on invalid code", async () => {
      authService.getChallengedUser.mockResolvedValue({ user: mockUser });
      twoFactorService.validateCode.mockResolvedValue(false);

      const dto = { challengeToken: "challenge-token", code: "wrong-code" };

      await expect(controller.challenge(dto, mockRequest)).rejects.toThrow();
      expect(throttleGuard.increment).toHaveBeenCalledWith(mockRequest);
    });

    it("should emit TWO_FACTOR_FAILED event on invalid code", async () => {
      authService.getChallengedUser.mockResolvedValue({ user: mockUser });
      twoFactorService.validateCode.mockResolvedValue(false);

      const dto = { challengeToken: "challenge-token", code: "wrong-code" };

      await expect(controller.challenge(dto, mockRequest)).rejects.toThrow();
      expect(eventEmitter.emit).toHaveBeenCalledWith(AUTH_EVENTS.TWO_FACTOR_FAILED, {
        user: mockUser,
      });
    });
  });

  describe("challenge with valid recovery code", () => {
    it("should return tokens when recovery code is valid", async () => {
      authService.getChallengedUser.mockResolvedValue({ user: mockUser });
      twoFactorService.validateRecoveryCode.mockResolvedValue(true);
      authService.generateTokens.mockResolvedValue({
        accessToken: "access",
        refreshToken: "refresh",
      });

      const dto = { challengeToken: "challenge-token", recoveryCode: "recovery-code-1" };
      const result = await controller.challenge(dto, mockRequest);

      expect(result).toEqual({
        twoFactor: false,
        accessToken: "access",
        refreshToken: "refresh",
      });
    });

    it("should clear throttle on valid recovery code", async () => {
      authService.getChallengedUser.mockResolvedValue({ user: mockUser });
      twoFactorService.validateRecoveryCode.mockResolvedValue(true);
      authService.generateTokens.mockResolvedValue({
        accessToken: "access",
        refreshToken: "refresh",
      });

      const dto = { challengeToken: "challenge-token", recoveryCode: "recovery-code-1" };
      await controller.challenge(dto, mockRequest);

      expect(throttleGuard.clear).toHaveBeenCalledWith(mockRequest);
    });

    it("should emit VALID_TWO_FACTOR_CODE event on valid recovery code", async () => {
      authService.getChallengedUser.mockResolvedValue({ user: mockUser });
      twoFactorService.validateRecoveryCode.mockResolvedValue(true);
      authService.generateTokens.mockResolvedValue({
        accessToken: "access",
        refreshToken: "refresh",
      });

      const dto = { challengeToken: "challenge-token", recoveryCode: "recovery-code-1" };
      await controller.challenge(dto, mockRequest);

      expect(eventEmitter.emit).toHaveBeenCalledWith(AUTH_EVENTS.VALID_TWO_FACTOR_CODE, {
        user: mockUser,
      });
    });

    it("should validate recovery code with twoFactorService", async () => {
      authService.getChallengedUser.mockResolvedValue({ user: mockUser });
      twoFactorService.validateRecoveryCode.mockResolvedValue(true);
      authService.generateTokens.mockResolvedValue({
        accessToken: "access",
        refreshToken: "refresh",
      });

      const dto = { challengeToken: "challenge-token", recoveryCode: "my-recovery-code" };
      await controller.challenge(dto, mockRequest);

      expect(twoFactorService.validateRecoveryCode).toHaveBeenCalledWith(mockUser, "my-recovery-code");
    });
  });

  describe("challenge with invalid recovery code", () => {
    it("should throw UnprocessableEntityException when recovery code is invalid", async () => {
      authService.getChallengedUser.mockResolvedValue({ user: mockUser });
      twoFactorService.validateRecoveryCode.mockResolvedValue(false);

      const dto = { challengeToken: "challenge-token", recoveryCode: "bad-code" };

      await expect(controller.challenge(dto, mockRequest)).rejects.toThrow(
        UnprocessableEntityException,
      );
    });

    it("should throw with correct message when recovery code is invalid", async () => {
      authService.getChallengedUser.mockResolvedValue({ user: mockUser });
      twoFactorService.validateRecoveryCode.mockResolvedValue(false);

      const dto = { challengeToken: "challenge-token", recoveryCode: "bad-code" };

      await expect(controller.challenge(dto, mockRequest)).rejects.toThrow(
        "The provided recovery code was invalid.",
      );
    });

    it("should increment throttle on invalid recovery code", async () => {
      authService.getChallengedUser.mockResolvedValue({ user: mockUser });
      twoFactorService.validateRecoveryCode.mockResolvedValue(false);

      const dto = { challengeToken: "challenge-token", recoveryCode: "bad-code" };

      await expect(controller.challenge(dto, mockRequest)).rejects.toThrow();
      expect(throttleGuard.increment).toHaveBeenCalledWith(mockRequest);
    });

    it("should emit TWO_FACTOR_FAILED event on invalid recovery code", async () => {
      authService.getChallengedUser.mockResolvedValue({ user: mockUser });
      twoFactorService.validateRecoveryCode.mockResolvedValue(false);

      const dto = { challengeToken: "challenge-token", recoveryCode: "bad-code" };

      await expect(controller.challenge(dto, mockRequest)).rejects.toThrow();
      expect(eventEmitter.emit).toHaveBeenCalledWith(AUTH_EVENTS.TWO_FACTOR_FAILED, {
        user: mockUser,
      });
    });
  });

  describe("challenge with neither code nor recovery code", () => {
    it("should throw BadRequestException when neither code nor recoveryCode is provided", async () => {
      authService.getChallengedUser.mockResolvedValue({ user: mockUser });

      const dto = { challengeToken: "challenge-token" } as any;

      await expect(controller.challenge(dto, mockRequest)).rejects.toThrow(BadRequestException);
    });

    it("should throw with correct message when neither code nor recoveryCode is provided", async () => {
      authService.getChallengedUser.mockResolvedValue({ user: mockUser });

      const dto = { challengeToken: "challenge-token" } as any;

      await expect(controller.challenge(dto, mockRequest)).rejects.toThrow(
        "A code or recovery_code is required.",
      );
    });
  });

  describe("challenge with recovery code prioritized over code", () => {
    it("should use recoveryCode when both code and recoveryCode are provided", async () => {
      authService.getChallengedUser.mockResolvedValue({ user: mockUser });
      twoFactorService.validateRecoveryCode.mockResolvedValue(true);
      authService.generateTokens.mockResolvedValue({
        accessToken: "access",
        refreshToken: "refresh",
      });

      const dto = {
        challengeToken: "challenge-token",
        code: "123456",
        recoveryCode: "recovery-code-1",
      };
      await controller.challenge(dto, mockRequest);

      expect(twoFactorService.validateRecoveryCode).toHaveBeenCalledWith(mockUser, "recovery-code-1");
      expect(twoFactorService.validateCode).not.toHaveBeenCalled();
    });
  });

  describe("challenge without eventEmitter", () => {
    it("should work without eventEmitter on valid code", async () => {
      controller = new TwoFactorChallengeController(
        authService,
        twoFactorService,
        throttleGuard,
        undefined,
      );

      authService.getChallengedUser.mockResolvedValue({ user: mockUser });
      twoFactorService.validateCode.mockResolvedValue(true);
      authService.generateTokens.mockResolvedValue({
        accessToken: "access",
        refreshToken: "refresh",
      });

      const dto = { challengeToken: "challenge-token", code: "123456" };
      const result = await controller.challenge(dto, mockRequest);

      expect(result.twoFactor).toBe(false);
    });

    it("should work without eventEmitter on invalid code", async () => {
      controller = new TwoFactorChallengeController(
        authService,
        twoFactorService,
        throttleGuard,
        undefined,
      );

      authService.getChallengedUser.mockResolvedValue({ user: mockUser });
      twoFactorService.validateCode.mockResolvedValue(false);

      const dto = { challengeToken: "challenge-token", code: "wrong" };

      await expect(controller.challenge(dto, mockRequest)).rejects.toThrow(
        UnprocessableEntityException,
      );
    });

    it("should work without eventEmitter on invalid recovery code", async () => {
      controller = new TwoFactorChallengeController(
        authService,
        twoFactorService,
        throttleGuard,
        undefined,
      );

      authService.getChallengedUser.mockResolvedValue({ user: mockUser });
      twoFactorService.validateRecoveryCode.mockResolvedValue(false);

      const dto = { challengeToken: "challenge-token", recoveryCode: "bad" };

      await expect(controller.challenge(dto, mockRequest)).rejects.toThrow(
        UnprocessableEntityException,
      );
    });

    it("should work with eventEmitter that has no emit method on valid code", async () => {
      controller = new TwoFactorChallengeController(
        authService,
        twoFactorService,
        throttleGuard,
        {} as any,
      );

      authService.getChallengedUser.mockResolvedValue({ user: mockUser });
      twoFactorService.validateCode.mockResolvedValue(true);
      authService.generateTokens.mockResolvedValue({
        accessToken: "access",
        refreshToken: "refresh",
      });

      const dto = { challengeToken: "challenge-token", code: "123456" };
      const result = await controller.challenge(dto, mockRequest);

      expect(result.twoFactor).toBe(false);
    });

    it("should work with eventEmitter that has no emit method on invalid code", async () => {
      controller = new TwoFactorChallengeController(
        authService,
        twoFactorService,
        throttleGuard,
        {} as any,
      );

      authService.getChallengedUser.mockResolvedValue({ user: mockUser });
      twoFactorService.validateCode.mockResolvedValue(false);

      const dto = { challengeToken: "challenge-token", code: "wrong" };

      await expect(controller.challenge(dto, mockRequest)).rejects.toThrow(
        UnprocessableEntityException,
      );
    });

    it("should work with eventEmitter that has no emit method on invalid recovery code", async () => {
      controller = new TwoFactorChallengeController(
        authService,
        twoFactorService,
        throttleGuard,
        {} as any,
      );

      authService.getChallengedUser.mockResolvedValue({ user: mockUser });
      twoFactorService.validateRecoveryCode.mockResolvedValue(false);

      const dto = { challengeToken: "challenge-token", recoveryCode: "bad" };

      await expect(controller.challenge(dto, mockRequest)).rejects.toThrow(
        UnprocessableEntityException,
      );
    });
  });

  describe("challenge error propagation", () => {
    it("should propagate errors from getChallengedUser", async () => {
      authService.getChallengedUser.mockRejectedValue(new Error("Challenge not found"));

      const dto = { challengeToken: "bad-token", code: "123456" };

      await expect(controller.challenge(dto, mockRequest)).rejects.toThrow("Challenge not found");
    });

    it("should propagate errors from generateTokens", async () => {
      authService.getChallengedUser.mockResolvedValue({ user: mockUser });
      twoFactorService.validateCode.mockResolvedValue(true);
      authService.generateTokens.mockRejectedValue(new Error("Token generation failed"));

      const dto = { challengeToken: "challenge-token", code: "123456" };

      await expect(controller.challenge(dto, mockRequest)).rejects.toThrow(
        "Token generation failed",
      );
    });
  });
});
