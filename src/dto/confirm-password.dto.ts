import { IsString, IsNotEmpty } from "class-validator";

export class ConfirmPasswordDto {
  @IsString()
  @IsNotEmpty()
  password!: string;
}
