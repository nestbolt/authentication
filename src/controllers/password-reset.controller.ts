import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from "@nestjs/common";
import { Public, RequiresFeature } from "../decorators";
import { ForgotPasswordDto } from "../dto/forgot-password.dto";
import { ResetPasswordDto } from "../dto/reset-password.dto";
import { FeatureEnabledGuard } from "../guards/feature-enabled.guard";
import { Feature } from "../interfaces";
import { PasswordResetService } from "../services/password-reset.service";

@Controller()
@RequiresFeature(Feature.RESET_PASSWORDS)
@UseGuards(FeatureEnabledGuard)
export class PasswordResetController {
  constructor(private passwordResetService: PasswordResetService) {}

  @Post("forgot-password")
  @Public()
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    await this.passwordResetService.sendResetLink(dto.email);
    return { message: "If the email exists, a reset link has been sent." };
  }

  @Post("reset-password")
  @Public()
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() dto: ResetPasswordDto) {
    await this.passwordResetService.reset({
      email: dto.email,
      token: dto.token,
      password: dto.password,
    });
    return { message: "Your password has been reset." };
  }
}
