import { IsString, IsNotEmpty, IsOptional, IsBoolean } from "class-validator";

export class LoginDto {
  @IsString()
  @IsNotEmpty()
  email!: string;

  @IsString()
  @IsNotEmpty()
  password!: string;

  @IsOptional()
  @IsBoolean()
  remember?: boolean;
}
