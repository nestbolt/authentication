import { IsString, IsNotEmpty } from "class-validator";

export class TwoFactorConfirmDto {
  @IsString()
  @IsNotEmpty()
  code!: string;
}
