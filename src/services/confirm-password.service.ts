import { Injectable, Inject } from "@nestjs/common";
import * as bcrypt from "bcrypt";
import { AUTHENTICATION_OPTIONS, USER_REPOSITORY } from "../authentication.constants";
import { AuthenticationModuleOptions, UserRepository, AuthUser } from "../interfaces";

@Injectable()
export class ConfirmPasswordService {
  constructor(
    @Inject(USER_REPOSITORY) private userRepository: UserRepository,
    @Inject(AUTHENTICATION_OPTIONS) private options: AuthenticationModuleOptions,
  ) {}

  async confirm(user: AuthUser, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.password);
  }

  async storeConfirmationTimestamp(user: AuthUser): Promise<void> {
    await this.userRepository.save({
      id: user.id,
      passwordConfirmedAt: new Date(),
    });
  }

  async isRecentlyConfirmed(user: AuthUser, seconds?: number): Promise<boolean> {
    const timeout = seconds ?? this.options.passwordTimeout ?? 900;
    if (!user.passwordConfirmedAt) {
      return false;
    }
    const confirmedAt = new Date(user.passwordConfirmedAt).getTime();
    return (Date.now() - confirmedAt) / 1000 <= timeout;
  }
}
