import { SetMetadata } from "@nestjs/common";
import { Feature } from "../interfaces";

export const REQUIRED_FEATURE_KEY = "requiredFeature";
export const RequiresFeature = (feature: Feature) => SetMetadata(REQUIRED_FEATURE_KEY, feature);
