import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { AUTHENTICATION_OPTIONS } from "../authentication.constants";
import { REQUIRED_FEATURE_KEY } from "../decorators";
import { AuthenticationModuleOptions, Feature } from "../interfaces";

@Injectable()
export class FeatureEnabledGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @Inject(AUTHENTICATION_OPTIONS) private options: AuthenticationModuleOptions,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredFeature = this.reflector.getAllAndOverride<Feature>(REQUIRED_FEATURE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredFeature) {
      return true;
    }
    if (!this.options.features.includes(requiredFeature)) {
      throw new NotFoundException();
    }
    return true;
  }
}
