import { Body, Controller, HttpCode, HttpStatus, Post } from "@nestjs/common";
import { Public, RequiresFeature } from "../decorators";
import { RegisterDto } from "../dto/register.dto";
import { Feature } from "../interfaces";
import { RegistrationService } from "../services/registration.service";

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
