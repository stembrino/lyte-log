import { LOCAL_EXERCISE_IMAGE_BY_ID } from "@/constants/exerciseImages";
import type { ImageSourcePropType } from "react-native";

function isRemoteUrl(value: string): boolean {
  return /^https?:\/\//i.test(value);
}

export function resolveExerciseImageSource(
  exerciseId: string,
  imageUrl: string | null | undefined,
): ImageSourcePropType | null {
  const sourceById = LOCAL_EXERCISE_IMAGE_BY_ID[exerciseId];
  if (sourceById) {
    return sourceById;
  }

  if (!imageUrl) {
    return null;
  }

  if (isRemoteUrl(imageUrl) || imageUrl.startsWith("file://")) {
    return { uri: imageUrl };
  }

  return null;
}
