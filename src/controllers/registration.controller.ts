import { Controller, Post, Body, HttpCode, HttpStatus } from "@nestjs/common";
import { Public } from "../decorators";
import { RequiresFeature } from "../decorators";
import { Feature } from "../interfaces";
import { RegistrationService } from "../services/registration.service";
import { RegisterDto } from "../dto/register.dto";

@Controller()
@RequiresFeature(Feature.REGISTRATION)
export class RegistrationController {
  constructor(private registrationService: RegistrationService) {}

  @Post("register")
  @Public()
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerDto: RegisterDto) {
    const result = await this.registrationService.register(registerDto);
    return {
      twoFactor: false,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    };
  }
}
