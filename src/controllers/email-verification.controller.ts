import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { CurrentUser, RequiresFeature } from "../decorators";
import { JwtAuthGuard } from "../guards/jwt-auth.guard";
import { VerificationThrottleGuard } from "../guards/verification-throttle.guard";
import { AuthUser, Feature } from "../interfaces";
import { EmailVerificationService } from "../services/email-verification.service";

@Controller("email")
@RequiresFeature(Feature.EMAIL_VERIFICATION)
@UseGuards(JwtAuthGuard)
export class EmailVerificationController {
  constructor(private emailVerificationService: EmailVerificationService) {}

  @Get("verify/:id/:hash")
  @HttpCode(HttpStatus.OK)
  async verify(
    @Param("id") id: string,
    @Param("hash") hash: string,
    @Query("signature") signature: string,
    @Query("expires") expires: string,
    @CurrentUser() user: AuthUser,
  ) {
    await this.emailVerificationService.verify(user, id, hash, signature, expires);
    return { message: "Email verified successfully." };
  }

  @Post("verification-notification")
  @UseGuards(VerificationThrottleGuard)
  @HttpCode(HttpStatus.OK)
  async resend(@CurrentUser() user: AuthUser) {
    if (user.emailVerifiedAt) {
      return { message: "Email already verified." };
    }
    const verificationData = await this.emailVerificationService.sendVerificationNotification(user);
    return { message: "Verification link sent.", ...verificationData };
  }
}
