import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from "@nestjs/common";
import { CurrentUser, RequiresFeature } from "../decorators";
import { TwoFactorConfirmDto } from "../dto/two-factor-confirm.dto";
import { JwtAuthGuard } from "../guards/jwt-auth.guard";
import { PasswordConfirmedGuard } from "../guards/password-confirmed.guard";
import { AuthUser, Feature } from "../interfaces";
import { TwoFactorService } from "../services/two-factor.service";

@Controller("user")
@RequiresFeature(Feature.TWO_FACTOR_AUTHENTICATION)
@UseGuards(JwtAuthGuard)
export class TwoFactorController {
  constructor(private twoFactorService: TwoFactorService) {}

  @Post("two-factor-authentication")
  @UseGuards(PasswordConfirmedGuard)
  @HttpCode(HttpStatus.OK)
  async enable(@CurrentUser() user: AuthUser, @Body() body: { force?: boolean }) {
    await this.twoFactorService.enable(user, body.force ?? false);
    return { message: "Two-factor authentication enabled." };
  }

  @Delete("two-factor-authentication")
  @UseGuards(PasswordConfirmedGuard)
  @HttpCode(HttpStatus.OK)
  async disable(@CurrentUser() user: AuthUser) {
    await this.twoFactorService.disable(user);
    return { message: "Two-factor authentication disabled." };
  }

  @Post("confirmed-two-factor-authentication")
  @UseGuards(PasswordConfirmedGuard)
  @HttpCode(HttpStatus.OK)
  async confirm(@CurrentUser() user: AuthUser, @Body() dto: TwoFactorConfirmDto) {
    await this.twoFactorService.confirmSetup(user, dto.code);
    return { message: "Two-factor authentication confirmed." };
  }

  @Get("two-factor-qr-code")
  @UseGuards(PasswordConfirmedGuard)
  @HttpCode(HttpStatus.OK)
  async qrCode(@CurrentUser() user: AuthUser) {
    return this.twoFactorService.getQrCode(user);
  }

  @Get("two-factor-secret-key")
  @UseGuards(PasswordConfirmedGuard)
  @HttpCode(HttpStatus.OK)
  async secretKey(@CurrentUser() user: AuthUser) {
    return this.twoFactorService.getSecretKey(user);
  }

  @Get("two-factor-recovery-codes")
  @UseGuards(PasswordConfirmedGuard)
  @HttpCode(HttpStatus.OK)
  async getRecoveryCodes(@CurrentUser() user: AuthUser) {
    return this.twoFactorService.getRecoveryCodes(user);
  }

  @Post("two-factor-recovery-codes")
  @UseGuards(PasswordConfirmedGuard)
  @HttpCode(HttpStatus.OK)
  async regenerateRecoveryCodes(@CurrentUser() user: AuthUser) {
    await this.twoFactorService.regenerateRecoveryCodes(user);
    return { message: "Recovery codes regenerated." };
  }
}
