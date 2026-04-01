import { describe, it, expect, beforeEach } from "vitest";
import { FeatureEnabledGuard } from "../../src/guards/feature-enabled.guard";
import { Reflector } from "@nestjs/core";
import { NotFoundException } from "@nestjs/common";
import { Feature } from "../../src/interfaces";

describe("FeatureEnabledGuard", () => {
  let guard: FeatureEnabledGuard;
  let reflector: Reflector;

  function createMockContext(handlerMetadata?: Feature, classMetadata?: Feature) {
    return {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({ getRequest: () => ({}) }),
      _handlerMeta: handlerMetadata,
      _classMeta: classMetadata,
    } as any;
  }

  beforeEach(() => {
    reflector = new Reflector();
  });

  it("should allow access when no feature metadata is set", () => {
    guard = new FeatureEnabledGuard(reflector, {
      features: [],
      jwtSecret: "test",
      refreshSecret: "test",
      encryptionKey: "test",
      userRepository: class {} as any,
    });

    const mockContext = createMockContext();
    reflector.getAllAndOverride = () => undefined;

    expect(guard.canActivate(mockContext)).toBe(true);
  });

  it("should throw NotFoundException when feature is not enabled", () => {
    guard = new FeatureEnabledGuard(reflector, {
      features: [Feature.REGISTRATION],
      jwtSecret: "test",
      refreshSecret: "test",
      encryptionKey: "test",
      userRepository: class {} as any,
    });

    const mockContext = createMockContext(Feature.TWO_FACTOR_AUTHENTICATION);
    reflector.getAllAndOverride = () => Feature.TWO_FACTOR_AUTHENTICATION;

    expect(() => guard.canActivate(mockContext)).toThrow(NotFoundException);
  });

  it("should allow access when feature is enabled", () => {
    guard = new FeatureEnabledGuard(reflector, {
      features: [Feature.TWO_FACTOR_AUTHENTICATION],
      jwtSecret: "test",
      refreshSecret: "test",
      encryptionKey: "test",
      userRepository: class {} as any,
    });

    const mockContext = createMockContext(Feature.TWO_FACTOR_AUTHENTICATION);
    reflector.getAllAndOverride = () => Feature.TWO_FACTOR_AUTHENTICATION;

    expect(guard.canActivate(mockContext)).toBe(true);
  });
});
