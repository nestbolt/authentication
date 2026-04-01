import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  UnprocessableEntityException,
} from "@nestjs/common";
import { CurrentUser } from "../decorators";
import { AuthUser } from "../interfaces";
import { JwtAuthGuard } from "../guards/jwt-auth.guard";
import { ConfirmPasswordService } from "../services/confirm-password.service";
import { ConfirmPasswordDto } from "../dto/confirm-password.dto";

@Controller("user")
@UseGuards(JwtAuthGuard)
export class ConfirmPasswordController {
  constructor(private confirmPasswordService: ConfirmPasswordService) {}

  @Post("confirm-password")
  @HttpCode(HttpStatus.OK)
  async confirm(@CurrentUser() user: AuthUser, @Body() dto: ConfirmPasswordDto) {
    const confirmed = await this.confirmPasswordService.confirm(user, dto.password);
    if (!confirmed) {
      throw new UnprocessableEntityException("The provided password was incorrect.");
    }
    await this.confirmPasswordService.storeConfirmationTimestamp(user);
    return { confirmed: true };
  }

  @Get("confirmed-password-status")
  @HttpCode(HttpStatus.OK)
  async status(@CurrentUser() user: AuthUser, @Query("seconds") seconds?: string) {
    const timeout = seconds ? parseInt(seconds, 10) : undefined;
    const confirmed = await this.confirmPasswordService.isRecentlyConfirmed(user, timeout);
    return { confirmed };
  }
}
