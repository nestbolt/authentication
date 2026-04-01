import { Body, Controller, HttpCode, HttpStatus, Put, UseGuards } from "@nestjs/common";
import { CurrentUser, RequiresFeature } from "../decorators";
import { UpdateProfileDto } from "../dto/update-profile.dto";
import { FeatureEnabledGuard } from "../guards/feature-enabled.guard";
import { JwtAuthGuard } from "../guards/jwt-auth.guard";
import { AuthUser, Feature } from "../interfaces";
import { ProfileService } from "../services/profile.service";

@Controller("user")
@RequiresFeature(Feature.UPDATE_PROFILE_INFORMATION)
@UseGuards(FeatureEnabledGuard, JwtAuthGuard)
export class ProfileController {
  constructor(private profileService: ProfileService) {}

  @Put("profile-information")
  @HttpCode(HttpStatus.OK)
  async update(@CurrentUser() user: AuthUser, @Body() dto: UpdateProfileDto) {
    await this.profileService.update(user, dto);
    return { message: "Profile information updated." };
  }
}
