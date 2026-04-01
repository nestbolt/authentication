import { Inject, Injectable, Optional, UnprocessableEntityException } from "@nestjs/common";
import * as bcrypt from "bcrypt";
import { randomBytes } from "crypto";
import {
  AUTHENTICATION_OPTIONS,
  PASSWORD_RESET_REPOSITORY,
  RESETS_USER_PASSWORDS,
  USER_REPOSITORY,
} from "../authentication.constants";
import { AUTH_EVENTS } from "../events";
import {
  AuthenticationModuleOptions,
  EventEmitterLike,
  PasswordResetRepository,
  ResetsUserPasswords,
  UserRepository,
} from "../interfaces";

@Injectable()
export class PasswordResetService {
  constructor(
    @Inject(USER_REPOSITORY) private userRepository: UserRepository,
    @Inject(PASSWORD_RESET_REPOSITORY) private resetRepository: PasswordResetRepository,
    @Inject(RESETS_USER_PASSWORDS) private resetter: ResetsUserPasswords,
    @Inject(AUTHENTICATION_OPTIONS) private options: AuthenticationModuleOptions,
    @Optional() @Inject("EventEmitter2") private eventEmitter?: EventEmitterLike,
  ) {}

  async sendResetLink(email: string): Promise<{ token: string }> {
    const user = await this.userRepository.findByField(
      this.options.usernameField ?? "email",
      email,
    );
    if (!user) {
      return { token: "" };
    }

    const rawToken = randomBytes(32).toString("hex");
    const hashedToken = await bcrypt.hash(rawToken, 12);
    await this.resetRepository.createToken(email, hashedToken);

    return { token: rawToken };
  }

  async reset(data: { email: string; token: string; password: string }): Promise<void> {
    const record = await this.resetRepository.findByEmail(data.email);
    if (!record) {
      throw new UnprocessableEntityException("Invalid password reset token.");
    }

    const tokenAge = (Date.now() - record.createdAt.getTime()) / 1000 / 60;
    if (tokenAge > 60) {
      throw new UnprocessableEntityException("Password reset token has expired.");
    }

    const valid = await bcrypt.compare(data.token, record.token);
    if (!valid) {
      throw new UnprocessableEntityException("Invalid password reset token.");
    }

    const user = await this.userRepository.findByField(
      this.options.usernameField ?? "email",
      data.email,
    );
    if (!user) {
      throw new UnprocessableEntityException("Invalid password reset token.");
    }

    await this.resetter.reset(user, data.password);
    await this.resetRepository.deleteByEmail(data.email);

    this.eventEmitter?.emit?.(AUTH_EVENTS.PASSWORD_RESET, { user });
  }
}
