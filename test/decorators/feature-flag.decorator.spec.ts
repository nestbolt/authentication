import { describe, it, expect } from "vitest";
import { REQUIRED_FEATURE_KEY, RequiresFeature } from "../../src/decorators/feature-flag.decorator";
import { Feature } from "../../src/interfaces";

describe("RequiresFeature decorator", () => {
  it("should export REQUIRED_FEATURE_KEY as 'requiredFeature'", () => {
    expect(REQUIRED_FEATURE_KEY).toBe("requiredFeature");
  });

  it("should set metadata with the given feature on a class", () => {
    @RequiresFeature(Feature.REGISTRATION)
    class TestController {}

    const metadata = Reflect.getMetadata(REQUIRED_FEATURE_KEY, TestController);
    expect(metadata).toBe(Feature.REGISTRATION);
  });

  it("should set metadata with TWO_FACTOR_AUTHENTICATION feature", () => {
    @RequiresFeature(Feature.TWO_FACTOR_AUTHENTICATION)
    class TestController {}

    const metadata = Reflect.getMetadata(REQUIRED_FEATURE_KEY, TestController);
    expect(metadata).toBe(Feature.TWO_FACTOR_AUTHENTICATION);
  });

  it("should set metadata on a method when applied as method decorator", () => {
    class TestController {
      @RequiresFeature(Feature.RESET_PASSWORDS)
      testMethod() {}
    }

    const metadata = Reflect.getMetadata(REQUIRED_FEATURE_KEY, TestController.prototype.testMethod);
    expect(metadata).toBe(Feature.RESET_PASSWORDS);
  });

  it("should not set metadata on unannotated classes", () => {
    class PlainController {}

    const metadata = Reflect.getMetadata(REQUIRED_FEATURE_KEY, PlainController);
    expect(metadata).toBeUndefined();
  });

  it("should set metadata for EMAIL_VERIFICATION feature", () => {
    @RequiresFeature(Feature.EMAIL_VERIFICATION)
    class TestController {}

    const metadata = Reflect.getMetadata(REQUIRED_FEATURE_KEY, TestController);
    expect(metadata).toBe(Feature.EMAIL_VERIFICATION);
  });

  it("should set metadata for UPDATE_PROFILE_INFORMATION feature", () => {
    class TestController {
      @RequiresFeature(Feature.UPDATE_PROFILE_INFORMATION)
      testMethod() {}
    }

    const metadata = Reflect.getMetadata(REQUIRED_FEATURE_KEY, TestController.prototype.testMethod);
    expect(metadata).toBe(Feature.UPDATE_PROFILE_INFORMATION);
  });

  it("should set metadata for UPDATE_PASSWORDS feature", () => {
    class TestController {
      @RequiresFeature(Feature.UPDATE_PASSWORDS)
      testMethod() {}
    }

    const metadata = Reflect.getMetadata(REQUIRED_FEATURE_KEY, TestController.prototype.testMethod);
    expect(metadata).toBe(Feature.UPDATE_PASSWORDS);
  });
});
