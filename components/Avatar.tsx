import { useRetroPalette } from "@/components/hooks/useRetroPalette";
import { monoFont } from "@/constants/retroTheme";
import { Image, StyleSheet, Text, type ImageSourcePropType, View } from "react-native";

type AvatarSize = "sm" | "md" | "lg";

type AvatarProps = {
  label: string;
  size?: AvatarSize;
  imageSource?: ImageSourcePropType | null;
};

const SIZE_MAP: Record<AvatarSize, number> = {
  sm: 28,
  md: 44,
  lg: 64,
};

const FONT_SIZE_MAP: Record<AvatarSize, number> = {
  sm: 10,
  md: 12,
  lg: 14,
};

function getAvatarText(label: string): string {
  const parts = label.trim().split(/\s+/).filter(Boolean).slice(0, 2);

  if (parts.length === 0) {
    return "--";
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return parts
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export function Avatar({ label, size = "md", imageSource }: AvatarProps) {
  const palette = useRetroPalette();
  const dimension = SIZE_MAP[size];

  return (
    <View
      style={[
        styles.container,
        {
          width: dimension,
          height: dimension,
          borderColor: palette.border,
          backgroundColor: palette.listSelected,
        },
      ]}
    >
      {imageSource ? (
        <Image
          source={imageSource}
          style={[
            styles.image,
            {
              width: dimension - 6,
              height: dimension - 6,
            },
          ]}
          resizeMode="cover"
          testID="avatar-image"
        />
      ) : (
        <Text
          style={[
            styles.label,
            {
              color: palette.textPrimary,
              fontSize: FONT_SIZE_MAP[size],
            },
          ]}
        >
          {getAvatarText(label)}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: 2,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  image: {
    borderRadius: 2,
  },
  label: {
    fontFamily: monoFont,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
});
