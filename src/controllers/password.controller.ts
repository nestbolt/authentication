import { Body, Controller, HttpCode, HttpStatus, Put, UseGuards } from "@nestjs/common";
import { CurrentUser, RequiresFeature } from "../decorators";
import { UpdatePasswordDto } from "../dto/update-password.dto";
import { FeatureEnabledGuard } from "../guards/feature-enabled.guard";
import { JwtAuthGuard } from "../guards/jwt-auth.guard";
import { AuthUser, Feature } from "../interfaces";
import { PasswordService } from "../services/password.service";

@Controller("user")
@RequiresFeature(Feature.UPDATE_PASSWORDS)
@UseGuards(FeatureEnabledGuard, JwtAuthGuard)
export class PasswordController {
  constructor(private passwordService: PasswordService) {}

  @Put("password")
  @HttpCode(HttpStatus.OK)
  async update(@CurrentUser() user: AuthUser, @Body() dto: UpdatePasswordDto) {
    await this.passwordService.update(user, dto);
    return { message: "Password updated." };
  }
}
