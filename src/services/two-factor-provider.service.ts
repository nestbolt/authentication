import { Injectable, Inject } from "@nestjs/common";
import { authenticator } from "otplib";
import * as qrcode from "qrcode";
import { AUTHENTICATION_OPTIONS } from "../authentication.constants";
import { AuthenticationModuleOptions } from "../interfaces";

@Injectable()
export class TwoFactorProviderService {
  constructor(
    @Inject(AUTHENTICATION_OPTIONS) private options: AuthenticationModuleOptions,
  ) {
    const window = options.twoFactorOptions?.window;
    if (window !== undefined) {
      authenticator.options = { window };
    }
  }

  generateSecretKey(): string {
    const length = this.options.twoFactorOptions?.secretLength ?? 20;
    return authenticator.generateSecret(length);
  }

  getQrCodeUrl(appName: string, userEmail: string, secret: string): string {
    return authenticator.keyuri(userEmail, appName, secret);
  }

  async getQrCodeSvg(otpauthUrl: string): Promise<string> {
    return qrcode.toString(otpauthUrl, { type: "svg" });
  }

  verify(secret: string, code: string): boolean {
    try {
      return authenticator.check(code, secret);
    } catch {
      return false;
    }
  }
}
