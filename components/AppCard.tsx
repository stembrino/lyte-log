import { useRetroPalette } from "@/components/hooks/useRetroPalette";
import { monoFont } from "@/constants/retroTheme";
import type { PropsWithChildren, ReactNode } from "react";
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";

type AppCardProps = PropsWithChildren<{
  title?: string;
  subtitle?: string;
  rightAdornment?: ReactNode;
  showAccentBar?: boolean;
  accentColor?: string;
  backgroundColor?: string;
  borderColor?: string;
  style?: StyleProp<ViewStyle>;
}>;

export function AppCard({
  title,
  subtitle,
  rightAdornment,
  showAccentBar = true,
  accentColor,
  backgroundColor,
  borderColor,
  style,
  children,
}: AppCardProps) {
  const palette = useRetroPalette();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: backgroundColor ?? palette.card,
          borderColor: borderColor ?? palette.border,
        },
        style,
      ]}
    >
      {showAccentBar ? (
        <View style={[styles.accentBar, { backgroundColor: accentColor ?? palette.accent }]} />
      ) : null}

      {title || subtitle || rightAdornment ? (
        <View style={styles.headerBlock}>
          <View style={styles.headerRow}>
            <View style={styles.headerCopy}>
              {title ? (
                <Text style={[styles.title, { color: palette.textPrimary }]}>{title}</Text>
              ) : null}
              {subtitle ? (
                <Text style={[styles.subtitle, { color: palette.textSecondary }]}>{subtitle}</Text>
              ) : null}
            </View>
            {rightAdornment ? <View>{rightAdornment}</View> : null}
          </View>
        </View>
      ) : null}

      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 6,
    padding: 16,
    position: "relative",
    overflow: "hidden",
  },
  accentBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 3,
  },
  headerBlock: {
    marginBottom: 8,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  headerCopy: {
    flex: 1,
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontFamily: monoFont,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  subtitle: {
    fontFamily: monoFont,
    fontSize: 12,
    lineHeight: 18,
  },
});
