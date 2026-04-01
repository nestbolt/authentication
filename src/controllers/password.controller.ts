import { Controller, Put, Body, HttpCode, HttpStatus, UseGuards } from "@nestjs/common";
import { RequiresFeature, CurrentUser } from "../decorators";
import { Feature, AuthUser } from "../interfaces";
import { JwtAuthGuard } from "../guards/jwt-auth.guard";
import { PasswordService } from "../services/password.service";
import { UpdatePasswordDto } from "../dto/update-password.dto";

@Controller("user")
@RequiresFeature(Feature.UPDATE_PASSWORDS)
@UseGuards(JwtAuthGuard)
export class PasswordController {
  constructor(private passwordService: PasswordService) {}

  @Put("password")
  @HttpCode(HttpStatus.OK)
  async update(@CurrentUser() user: AuthUser, @Body() dto: UpdatePasswordDto) {
    await this.passwordService.update(user, dto);
    return { message: "Password updated." };
  }
}
