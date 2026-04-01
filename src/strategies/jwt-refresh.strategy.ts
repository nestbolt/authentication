import { Injectable, Inject, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { AUTHENTICATION_OPTIONS, USER_REPOSITORY } from "../authentication.constants";
import { AuthenticationModuleOptions, UserRepository } from "../interfaces";

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, "jwt-refresh") {
  constructor(
    @Inject(AUTHENTICATION_OPTIONS) options: AuthenticationModuleOptions,
    @Inject(USER_REPOSITORY) private userRepository: UserRepository,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromBodyField("refreshToken"),
      ignoreExpiration: false,
      secretOrKey: options.refreshSecret,
    });
  }

  async validate(payload: { sub: string }): Promise<any> {
    const user = await this.userRepository.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }
}
