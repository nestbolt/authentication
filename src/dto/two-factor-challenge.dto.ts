import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class TwoFactorChallengeDto {
  @IsString()
  @IsNotEmpty()
  challengeToken!: string;

  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsString()
  recoveryCode?: string;
}
