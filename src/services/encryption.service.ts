import { Injectable, Inject } from "@nestjs/common";
import { createCipheriv, createDecipheriv, randomBytes } from "crypto";
import { AUTHENTICATION_OPTIONS } from "../authentication.constants";
import { AuthenticationModuleOptions } from "../interfaces";

@Injectable()
export class EncryptionService {
  private readonly algorithm = "aes-256-gcm";
  private readonly keyBuffer: Buffer;

  constructor(
    @Inject(AUTHENTICATION_OPTIONS) private options: AuthenticationModuleOptions,
  ) {
    this.keyBuffer = Buffer.from(options.encryptionKey, "base64");
    if (this.keyBuffer.length !== 32) {
      throw new Error("Encryption key must be 32 bytes (base64-encoded).");
    }
  }

  encrypt(plaintext: string): string {
    const iv = randomBytes(16);
    const cipher = createCipheriv(this.algorithm, this.keyBuffer, iv);
    let encrypted = cipher.update(plaintext, "utf8", "base64");
    encrypted += cipher.final("base64");
    const authTag = cipher.getAuthTag();
    return `${iv.toString("base64")}:${authTag.toString("base64")}:${encrypted}`;
  }

  decrypt(encryptedText: string): string {
    const [ivB64, authTagB64, ciphertext] = encryptedText.split(":");
    const iv = Buffer.from(ivB64, "base64");
    const authTag = Buffer.from(authTagB64, "base64");
    const decipher = createDecipheriv(this.algorithm, this.keyBuffer, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(ciphertext, "base64", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  }
}
