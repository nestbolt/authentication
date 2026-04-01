import { describe, it, expect, beforeEach } from "vitest";
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
    await expect(createService(shortKey)).rejects.toThrow(
      "Encryption key must be 32 bytes",
    );
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
});
