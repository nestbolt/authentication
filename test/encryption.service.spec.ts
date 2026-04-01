import { describe, it, expect, beforeEach, vi } from "vitest";
import { Test, TestingModule } from "@nestjs/testing";
import { EncryptionService } from "../src/services/encryption.service";
import { AUTHENTICATION_OPTIONS } from "../src/authentication.constants";
import { randomBytes } from "crypto";

describe("EncryptionService", () => {
  let service: EncryptionService;
  const validKey = randomBytes(32).toString("base64");

  async function createService(encryptionKey: string): Promise<EncryptionService> {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: AUTHENTICATION_OPTIONS,
          useValue: { encryptionKey },
        },
        EncryptionService,
      ],
    }).compile();

    return module.get<EncryptionService>(EncryptionService);
  }

  beforeEach(async () => {
    service = await createService(validKey);
  });

  it("should encrypt and decrypt a string", () => {
    const plaintext = "my-secret-totp-key";
    const encrypted = service.encrypt(plaintext);
    expect(encrypted).not.toBe(plaintext);
    expect(encrypted.split(":")).toHaveLength(3);

    const decrypted = service.decrypt(encrypted);
    expect(decrypted).toBe(plaintext);
  });

  it("should produce different ciphertexts for same plaintext", () => {
    const plaintext = "same-value";
    const encrypted1 = service.encrypt(plaintext);
    const encrypted2 = service.encrypt(plaintext);
    expect(encrypted1).not.toBe(encrypted2);
  });

  it("should throw on invalid key length", async () => {
    const shortKey = randomBytes(16).toString("base64");
    await expect(createService(shortKey)).rejects.toThrow("Encryption key must be 32 bytes");
  });

  it("should handle empty string encryption", () => {
    const encrypted = service.encrypt("");
    const decrypted = service.decrypt(encrypted);
    expect(decrypted).toBe("");
  });

  it("should handle unicode content", () => {
    const plaintext = "Hello, World!";
    const encrypted = service.encrypt(plaintext);
    const decrypted = service.decrypt(encrypted);
    expect(decrypted).toBe(plaintext);
  });

  it("should throw on invalid encrypted data format (wrong number of parts)", () => {
    expect(() => service.decrypt("onlyonepart")).toThrow("Invalid encrypted data format.");
  });

  it("should throw on invalid encrypted data format (two parts)", () => {
    expect(() => service.decrypt("part1:part2")).toThrow("Invalid encrypted data format.");
  });

  it("should throw on invalid encrypted data format (four parts)", () => {
    expect(() => service.decrypt("a:b:c:d")).toThrow("Invalid encrypted data format.");
  });

  it("should throw 'Failed to decrypt data' when decryption fails with corrupted data", () => {
    // Valid format (3 parts) but corrupted content
    const badIv = randomBytes(16).toString("base64");
    const badTag = randomBytes(16).toString("base64");
    const badCiphertext = "corrupted-base64-data";

    expect(() => service.decrypt(`${badIv}:${badTag}:${badCiphertext}`)).toThrow(
      "Failed to decrypt data.",
    );
  });

  it("should throw 'Failed to decrypt data' when auth tag is wrong", () => {
    const encrypted = service.encrypt("test");
    const parts = encrypted.split(":");
    // Corrupt the auth tag
    parts[1] = randomBytes(16).toString("base64");
    expect(() => service.decrypt(parts.join(":"))).toThrow("Failed to decrypt data.");
  });

  it("should throw 'Failed to decrypt data' for any error inside try block", () => {
    const originalFrom = Buffer.from;
    let callCount = 0;
    const spy = vi.spyOn(Buffer, "from").mockImplementation((...args: any[]) => {
      callCount++;
      if (callCount > 0 && args[1] === "base64") {
        throw new Error("Unexpected internal error");
      }
      return originalFrom.call(Buffer, ...args) as any;
    });

    try {
      expect(() => service.decrypt("aaa:bbb:ccc")).toThrow("Failed to decrypt data.");
    } finally {
      spy.mockRestore();
    }
  });
});
