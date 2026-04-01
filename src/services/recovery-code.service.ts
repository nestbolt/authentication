import { Injectable } from "@nestjs/common";
import { randomBytes } from "crypto";

@Injectable()
export class RecoveryCodeService {
  generateCode(): string {
    return `${this.randomAlphanumeric(10)}-${this.randomAlphanumeric(10)}`;
  }

  generateCodes(count: number = 8): string[] {
    return Array.from({ length: count }, () => this.generateCode());
  }

  private randomAlphanumeric(length: number): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    const bytes = randomBytes(length);
    return Array.from(bytes)
      .map((b) => chars[b % chars.length])
      .join("");
  }
}
