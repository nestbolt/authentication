import { Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { AUTHENTICATION_OPTIONS, USER_REPOSITORY } from "../authentication.constants";
import { AuthenticationModuleOptions, UserRepository } from "../interfaces";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, "jwt") {
  constructor(
    @Inject(AUTHENTICATION_OPTIONS) options: AuthenticationModuleOptions,
    @Inject(USER_REPOSITORY) private userRepository: UserRepository,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: options.jwtSecret,
    });
  }

  async validate(payload: { sub: string; email: string }): Promise<any> {
    const user = await this.userRepository.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }
}
