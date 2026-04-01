import {
  Injectable,
  Inject,
  Optional,
  UnauthorizedException,
  UnprocessableEntityException,
} from "@nestjs/common";
import { createHmac, timingSafeEqual } from "crypto";
import { AUTHENTICATION_OPTIONS, USER_REPOSITORY } from "../authentication.constants";
import { AuthenticationModuleOptions, UserRepository, AuthUser } from "../interfaces";
import { AUTH_EVENTS } from "../events";

@Injectable()
export class EmailVerificationService {
  constructor(
    @Inject(USER_REPOSITORY) private userRepository: UserRepository,
    @Inject(AUTHENTICATION_OPTIONS) private options: AuthenticationModuleOptions,
    @Optional() @Inject("EventEmitter2") private eventEmitter?: any,
  ) {}

  generateVerificationUrl(user: AuthUser): {
    id: string;
    hash: string;
    signature: string;
    expires: string;
  } {
    const expires = String(Date.now() + 60 * 60 * 1000);
    const hash = createHmac("sha256", this.options.jwtSecret)
      .update(user.email)
      .digest("hex");
    const signPayload = `${user.id}:${hash}:${expires}`;
    const signature = createHmac("sha256", this.options.jwtSecret)
      .update(signPayload)
      .digest("hex");

    return { id: user.id, hash, signature, expires };
  }

  async verify(
    user: AuthUser,
    id: string,
    hash: string,
    signature: string,
    expires: string,
  ): Promise<void> {
    if (user.id !== id) {
      throw new UnauthorizedException("Invalid verification link.");
    }

    if (Number(expires) < Date.now()) {
      throw new UnprocessableEntityException("Verification link has expired.");
    }

    const expectedHash = createHmac("sha256", this.options.jwtSecret)
      .update(user.email)
      .digest("hex");

    if (!timingSafeEqual(Buffer.from(hash), Buffer.from(expectedHash))) {
      throw new UnprocessableEntityException("Invalid verification link.");
    }

    const signPayload = `${id}:${hash}:${expires}`;
    const expectedSignature = createHmac("sha256", this.options.jwtSecret)
      .update(signPayload)
      .digest("hex");

    if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      throw new UnprocessableEntityException("Invalid verification link.");
    }

    if (!user.emailVerifiedAt) {
      await this.userRepository.save({
        id: user.id,
        emailVerifiedAt: new Date(),
      });
      this.eventEmitter?.emit?.(AUTH_EVENTS.EMAIL_VERIFIED, { user });
    }
  }

  async sendVerificationNotification(user: AuthUser): Promise<{ id: string; hash: string; signature: string; expires: string }> {
    return this.generateVerificationUrl(user);
  }
}
