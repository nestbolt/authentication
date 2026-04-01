import {
  Inject,
  Injectable,
  NotFoundException,
  Optional,
  UnprocessableEntityException,
} from "@nestjs/common";
import { timingSafeEqual } from "crypto";
import { AUTHENTICATION_OPTIONS, USER_REPOSITORY } from "../authentication.constants";
import { AUTH_EVENTS } from "../events";
import {
  AuthenticationModuleOptions,
  AuthUser,
  EventEmitterLike,
  UserRepository,
} from "../interfaces";
import { EncryptionService } from "./encryption.service";
import { RecoveryCodeService } from "./recovery-code.service";
import { TwoFactorProviderService } from "./two-factor-provider.service";

@Injectable()
export class TwoFactorService {
  constructor(
    @Inject(USER_REPOSITORY) private userRepository: UserRepository,
    @Inject(AUTHENTICATION_OPTIONS) private options: AuthenticationModuleOptions,
    private twoFactorProvider: TwoFactorProviderService,
    private encryptionService: EncryptionService,
    private recoveryCodeService: RecoveryCodeService,
    @Optional() @Inject("EventEmitter2") private eventEmitter?: EventEmitterLike,
  ) {}

  async enable(user: AuthUser, force: boolean = false): Promise<void> {
    if (user.twoFactorSecret && !force) {
      return;
    }

    const secret = this.twoFactorProvider.generateSecretKey();
    const recoveryCodes = this.recoveryCodeService.generateCodes(8);

    await this.userRepository.save({
      id: user.id,
      twoFactorSecret: this.encryptionService.encrypt(secret),
      twoFactorRecoveryCodes: this.encryptionService.encrypt(JSON.stringify(recoveryCodes)),
      twoFactorConfirmedAt: null,
    });

    this.eventEmitter?.emit?.(AUTH_EVENTS.TWO_FACTOR_ENABLED, { user });
  }

  async disable(user: AuthUser): Promise<void> {
    if (!user.twoFactorSecret && !user.twoFactorRecoveryCodes && !user.twoFactorConfirmedAt) {
      return;
    }

    await this.userRepository.save({
      id: user.id,
      twoFactorSecret: null,
      twoFactorRecoveryCodes: null,
      twoFactorConfirmedAt: null,
    });

    this.eventEmitter?.emit?.(AUTH_EVENTS.TWO_FACTOR_DISABLED, { user });
  }

  async confirmSetup(user: AuthUser, code: string): Promise<void> {
    if (!user.twoFactorSecret || !code) {
      throw new UnprocessableEntityException("The provided two-factor code was invalid.");
    }

    const secret = this.encryptionService.decrypt(user.twoFactorSecret);
    const valid = this.twoFactorProvider.verify(secret, code);
    if (!valid) {
      throw new UnprocessableEntityException("The provided two-factor code was invalid.");
    }

    await this.userRepository.save({
      id: user.id,
      twoFactorConfirmedAt: new Date(),
    });

    this.eventEmitter?.emit?.(AUTH_EVENTS.TWO_FACTOR_CONFIRMED, { user });
  }

  async validateCode(user: AuthUser, code: string): Promise<boolean> {
    if (!user.twoFactorSecret) {
      return false;
    }
    const secret = this.encryptionService.decrypt(user.twoFactorSecret);
    return this.twoFactorProvider.verify(secret, code);
  }

  async validateRecoveryCode(user: AuthUser, code: string): Promise<boolean> {
    if (!user.twoFactorRecoveryCodes) {
      return false;
    }

    const codes = this.getDecryptedRecoveryCodes(user);
    const codeBuffer = Buffer.from(code);
    const matchIndex = codes.findIndex((c) => {
      const storedBuffer = Buffer.from(c);
      if (codeBuffer.length !== storedBuffer.length) {
        return false;
      }
      return timingSafeEqual(codeBuffer, storedBuffer);
    });

    if (matchIndex === -1) {
      return false;
    }

    const newCode = this.recoveryCodeService.generateCode();
    codes[matchIndex] = newCode;

    await this.userRepository.save({
      id: user.id,
      twoFactorRecoveryCodes: this.encryptionService.encrypt(JSON.stringify(codes)),
    });

    this.eventEmitter?.emit?.(AUTH_EVENTS.RECOVERY_CODE_REPLACED, { user, code });
    return true;
  }

  async getQrCode(user: AuthUser): Promise<{ svg: string; url: string }> {
    if (!user.twoFactorSecret) {
      throw new NotFoundException("Two-factor authentication has not been enabled.");
    }

    const secret = this.encryptionService.decrypt(user.twoFactorSecret);
    const url = this.twoFactorProvider.getQrCodeUrl(
      this.options.appName ?? "NestBolt",
      user.email,
      secret,
    );
    const svg = await this.twoFactorProvider.getQrCodeSvg(url);
    return { svg, url };
  }

  async getSecretKey(user: AuthUser): Promise<{ secretKey: string }> {
    if (!user.twoFactorSecret) {
      throw new NotFoundException("Two-factor authentication has not been enabled.");
    }
    return { secretKey: this.encryptionService.decrypt(user.twoFactorSecret) };
  }

  async getRecoveryCodes(user: AuthUser): Promise<string[]> {
    if (!user.twoFactorSecret || !user.twoFactorRecoveryCodes) {
      return [];
    }
    return this.getDecryptedRecoveryCodes(user);
  }

  async regenerateRecoveryCodes(user: AuthUser): Promise<void> {
    const codes = this.recoveryCodeService.generateCodes(8);

    await this.userRepository.save({
      id: user.id,
      twoFactorRecoveryCodes: this.encryptionService.encrypt(JSON.stringify(codes)),
    });

    this.eventEmitter?.emit?.(AUTH_EVENTS.RECOVERY_CODES_GENERATED, { user });
  }

  private getDecryptedRecoveryCodes(user: AuthUser): string[] {
    if (!user.twoFactorRecoveryCodes) {
      return [];
    }
    try {
      return JSON.parse(this.encryptionService.decrypt(user.twoFactorRecoveryCodes));
    } catch {
      return [];
    }
  }
}
