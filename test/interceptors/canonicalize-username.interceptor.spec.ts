import { describe, it, expect, vi } from "vitest";
import { CanonicalizeUsernameInterceptor } from "../../src/interceptors/canonicalize-username.interceptor";
import { AuthenticationModuleOptions } from "../../src/interfaces";
import { of } from "rxjs";

describe("CanonicalizeUsernameInterceptor", () => {
  function createOptions(
    overrides: Partial<AuthenticationModuleOptions> = {},
  ): AuthenticationModuleOptions {
    return {
      features: [],
      jwtSecret: "test",
      refreshSecret: "test",
      encryptionKey: "test",
      userRepository: class {} as any,
      ...overrides,
    };
  }

  function createMockContext(body: Record<string, any>) {
    return {
      switchToHttp: () => ({
        getRequest: () => ({ body }),
      }),
    } as any;
  }

  function createMockCallHandler() {
    return {
      handle: vi.fn().mockReturnValue(of("next")),
    };
  }

  it("should lowercase the email field by default", () => {
    const interceptor = new CanonicalizeUsernameInterceptor(createOptions());
    const body = { email: "TEST@EXAMPLE.COM" };
    const context = createMockContext(body);
    const next = createMockCallHandler();

    interceptor.intercept(context, next);

    expect(body.email).toBe("test@example.com");
    expect(next.handle).toHaveBeenCalled();
  });

  it("should lowercase a custom usernameField", () => {
    const interceptor = new CanonicalizeUsernameInterceptor(
      createOptions({ usernameField: "username" }),
    );
    const body = { username: "MyUser" };
    const context = createMockContext(body);
    const next = createMockCallHandler();

    interceptor.intercept(context, next);

    expect(body.username).toBe("myuser");
  });

  it("should not modify the body when lowercaseUsernames is false", () => {
    const interceptor = new CanonicalizeUsernameInterceptor(
      createOptions({ lowercaseUsernames: false }),
    );
    const body = { email: "TEST@EXAMPLE.COM" };
    const context = createMockContext(body);
    const next = createMockCallHandler();

    interceptor.intercept(context, next);

    expect(body.email).toBe("TEST@EXAMPLE.COM");
    expect(next.handle).toHaveBeenCalled();
  });

  it("should lowercase when lowercaseUsernames is true", () => {
    const interceptor = new CanonicalizeUsernameInterceptor(
      createOptions({ lowercaseUsernames: true }),
    );
    const body = { email: "MiXeD@CaSe.COM" };
    const context = createMockContext(body);
    const next = createMockCallHandler();

    interceptor.intercept(context, next);

    expect(body.email).toBe("mixed@case.com");
  });

  it("should lowercase when lowercaseUsernames is undefined (default behavior)", () => {
    const interceptor = new CanonicalizeUsernameInterceptor(
      createOptions({ lowercaseUsernames: undefined }),
    );
    const body = { email: "TEST@EXAMPLE.COM" };
    const context = createMockContext(body);
    const next = createMockCallHandler();

    interceptor.intercept(context, next);

    expect(body.email).toBe("test@example.com");
  });

  it("should not modify when the field does not exist in body", () => {
    const interceptor = new CanonicalizeUsernameInterceptor(createOptions());
    const body = { password: "secret" };
    const context = createMockContext(body);
    const next = createMockCallHandler();

    interceptor.intercept(context, next);

    expect(body).toEqual({ password: "secret" });
    expect(next.handle).toHaveBeenCalled();
  });

  it("should not modify when body is undefined", () => {
    const interceptor = new CanonicalizeUsernameInterceptor(createOptions());
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({ body: undefined }),
      }),
    } as any;
    const next = createMockCallHandler();

    // Should not throw
    interceptor.intercept(context, next);

    expect(next.handle).toHaveBeenCalled();
  });

  it("should not modify when body is null", () => {
    const interceptor = new CanonicalizeUsernameInterceptor(createOptions());
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({ body: null }),
      }),
    } as any;
    const next = createMockCallHandler();

    interceptor.intercept(context, next);

    expect(next.handle).toHaveBeenCalled();
  });

  it("should convert non-string field values via String()", () => {
    const interceptor = new CanonicalizeUsernameInterceptor(createOptions());
    const body = { email: 12345 };
    const context = createMockContext(body as any);
    const next = createMockCallHandler();

    interceptor.intercept(context, next);

    expect(body.email).toBe("12345");
  });

  it("should return the observable from next.handle()", () => {
    const interceptor = new CanonicalizeUsernameInterceptor(createOptions());
    const body = { email: "test@example.com" };
    const context = createMockContext(body);
    const next = createMockCallHandler();

    const result = interceptor.intercept(context, next);

    expect(result).toBeDefined();
    expect(next.handle).toHaveBeenCalledTimes(1);
  });

  it("should handle empty string field value", () => {
    const interceptor = new CanonicalizeUsernameInterceptor(createOptions());
    const body = { email: "" };
    const context = createMockContext(body);
    const next = createMockCallHandler();

    interceptor.intercept(context, next);

    // Empty string is falsy, so the if guard `request.body?.[field]` is false
    // The field should NOT be modified
    expect(body.email).toBe("");
    expect(next.handle).toHaveBeenCalled();
  });
});
