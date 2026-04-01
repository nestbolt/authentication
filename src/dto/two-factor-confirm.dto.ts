import { IsNotEmpty, IsString } from "class-validator";

export class TwoFactorConfirmDto {
  @IsString()
  @IsNotEmpty()
  code!: string;
}
