import { Controller, Put, Body, HttpCode, HttpStatus, UseGuards } from "@nestjs/common";
import { RequiresFeature, CurrentUser } from "../decorators";
import { Feature, AuthUser } from "../interfaces";
import { JwtAuthGuard } from "../guards/jwt-auth.guard";
import { ProfileService } from "../services/profile.service";
import { UpdateProfileDto } from "../dto/update-profile.dto";

@Controller("user")
@RequiresFeature(Feature.UPDATE_PROFILE_INFORMATION)
@UseGuards(JwtAuthGuard)
export class ProfileController {
  constructor(private profileService: ProfileService) {}

  @Put("profile-information")
  @HttpCode(HttpStatus.OK)
  async update(@CurrentUser() user: AuthUser, @Body() dto: UpdateProfileDto) {
    await this.profileService.update(user, dto);
    return { message: "Profile information updated." };
  }
}
