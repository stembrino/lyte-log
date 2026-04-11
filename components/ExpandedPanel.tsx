import { Badge } from "@/components/Badge";
import { useRetroPalette } from "@/components/hooks/useRetroPalette";
import { monoFont } from "@/constants/retroTheme";
import type { PropsWithChildren, ReactNode } from "react";
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";

type ExpandedPanelProps = PropsWithChildren<{
  title: string;
  subtitle?: string;
  count?: number;
  expanded: boolean;
  onToggle: () => void;
  headerAction?: ReactNode;
  style?: StyleProp<ViewStyle>;
}>;

export function ExpandedPanel({
  title,
  subtitle,
  count,
  expanded,
  onToggle,
  headerAction,
  style,
  children,
}: ExpandedPanelProps) {
  const palette = useRetroPalette();

  return (
    <View
      style={[
        styles.panel,
        {
          backgroundColor: palette.page,
          borderColor: palette.border,
        },
        style,
      ]}
    >
      <Pressable
        onPress={onToggle}
        style={({ pressed }) => [
          styles.header,
          {
            backgroundColor: pressed ? palette.listSelected : "transparent",
          },
        ]}
      >
        <View style={styles.headerCopy}>
          <Text style={[styles.title, { color: palette.textPrimary }]}>{title}</Text>
          {subtitle ? (
            <Text style={[styles.subtitle, { color: palette.textSecondary }]}>{subtitle}</Text>
          ) : null}
        </View>

        <View style={styles.headerRight}>
          {headerAction}
          {typeof count === "number" ? (
            <Badge
              value={count}
              textColor={palette.accent}
              borderColor={palette.accent}
              backgroundColor={palette.page}
            />
          ) : null}
          <Text style={[styles.icon, { color: palette.accent }]}>{expanded ? "-" : "+"}</Text>
        </View>
      </Pressable>

      {expanded ? <View style={styles.content}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    borderWidth: 1,
    borderRadius: 4,
    overflow: "hidden",
  },
  header: {
    minHeight: 56,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  headerCopy: {
    flex: 1,
    gap: 6,
  },
  title: {
    fontFamily: monoFont,
    fontSize: 16,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  subtitle: {
    fontFamily: monoFont,
    fontSize: 12,
    letterSpacing: 0.2,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  icon: {
    width: 16,
    textAlign: "center",
    fontFamily: monoFont,
    fontSize: 18,
    fontWeight: "700",
    lineHeight: 20,
  },
  content: {
    padding: 12,
    gap: 12,
  },
});
