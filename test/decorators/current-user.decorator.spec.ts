import { describe, it, expect } from "vitest";
import { ROUTE_ARGS_METADATA } from "@nestjs/common/constants";
import { CurrentUser } from "../../src/decorators/current-user.decorator";

describe("CurrentUser decorator", () => {
  // To test createParamDecorator, we apply it to a controller method and extract the factory
  function getParamDecoratorFactory() {
    class TestController {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      testMethod(@CurrentUser() _user: any) {}
    }

    const metadata = Reflect.getMetadata(ROUTE_ARGS_METADATA, TestController, "testMethod");
    // The metadata keys are in the format "decoratorType:paramIndex"
    const key = Object.keys(metadata)[0];
    return metadata[key].factory;
  }

  function createMockExecutionContext(user: any) {
    return {
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    };
  }

  it("should extract user from the request", () => {
    const factory = getParamDecoratorFactory();
    const mockUser = { id: "1", email: "test@example.com" };
    const ctx = createMockExecutionContext(mockUser);

    const result = factory(undefined, ctx);

    expect(result).toEqual(mockUser);
  });

  it("should return undefined when no user is on the request", () => {
    const factory = getParamDecoratorFactory();
    const ctx = createMockExecutionContext(undefined);

    const result = factory(undefined, ctx);

    expect(result).toBeUndefined();
  });

  it("should return null when user is null", () => {
    const factory = getParamDecoratorFactory();
    const ctx = createMockExecutionContext(null);

    const result = factory(null, ctx);

    expect(result).toBeNull();
  });
});
