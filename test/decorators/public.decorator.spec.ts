import { describe, it, expect } from "vitest";
import { IS_PUBLIC_KEY, Public } from "../../src/decorators/public.decorator";

describe("Public decorator", () => {
  it("should export IS_PUBLIC_KEY as 'isPublic'", () => {
    expect(IS_PUBLIC_KEY).toBe("isPublic");
  });

  it("should set metadata with IS_PUBLIC_KEY = true when applied", () => {
    @Public()
    class TestController {}

    const metadata = Reflect.getMetadata(IS_PUBLIC_KEY, TestController);
    expect(metadata).toBe(true);
  });

  it("should set metadata on a method when applied as method decorator", () => {
    class TestController {
      @Public()
      testMethod() {}
    }

    const metadata = Reflect.getMetadata(IS_PUBLIC_KEY, TestController.prototype.testMethod);
    expect(metadata).toBe(true);
  });

  it("should not set metadata on unannotated classes", () => {
    class PlainController {}

    const metadata = Reflect.getMetadata(IS_PUBLIC_KEY, PlainController);
    expect(metadata).toBeUndefined();
  });
});
