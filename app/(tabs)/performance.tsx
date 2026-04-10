import { StyleSheet, Text, View } from "react-native";

import { useColorScheme } from "@/components/hooks/useColorScheme";
import { useI18n } from "@/components/i18n-provider";
import { getRetroPalette, monoFont } from "@/constants/retroTheme";

export default function PerformanceScreen() {
  const colorScheme = useColorScheme();
  const { t } = useI18n();
  const palette = getRetroPalette(colorScheme);

  return (
    <View style={[styles.container, { backgroundColor: palette.page }]}>
      <Text style={[styles.title, { color: palette.textPrimary }]}>{t("performance.title")}</Text>
      <Text style={[styles.description, { color: palette.textSecondary }]}>
        {t("performance.subtitle")}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    fontFamily: monoFont,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  description: {
    marginTop: 8,
    textAlign: "center",
    fontFamily: monoFont,
    letterSpacing: 0.2,
  },
});
