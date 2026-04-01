import { describe, it, expect, beforeEach } from "vitest";
import { RecoveryCodeService } from "../src/services/recovery-code.service";

describe("RecoveryCodeService", () => {
  let service: RecoveryCodeService;

  beforeEach(() => {
    service = new RecoveryCodeService();
  });

  it("should generate a recovery code in XXXXXXXXXX-XXXXXXXXXX format", () => {
    const code = service.generateCode();
    expect(code).toMatch(/^[A-Za-z0-9]{10}-[A-Za-z0-9]{10}$/);
  });

  it("should generate unique codes", () => {
    const codes = service.generateCodes(8);
    const unique = new Set(codes);
    expect(unique.size).toBe(8);
  });

  it("should generate 8 codes by default", () => {
    const codes = service.generateCodes();
    expect(codes).toHaveLength(8);
  });

  it("should generate custom number of codes", () => {
    const codes = service.generateCodes(4);
    expect(codes).toHaveLength(4);
  });

  it("should generate alphanumeric characters only", () => {
    const codes = service.generateCodes(10);
    for (const code of codes) {
      expect(code).toMatch(/^[A-Za-z0-9]+-[A-Za-z0-9]+$/);
    }
  });
});
