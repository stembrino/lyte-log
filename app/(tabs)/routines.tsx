import { useRetroPalette } from "@/components/hooks/useRetroPalette";
import { useI18n } from "@/components/i18n-provider";
import { monoFont } from "@/constants/retroTheme";
import { StyleSheet, Text, View } from "react-native";

export default function RoutinesScreen() {
  const { t } = useI18n();
  const palette = useRetroPalette();

  return (
    <View style={[styles.container, { backgroundColor: palette.page }]}>
      <Text style={[styles.title, { color: palette.textPrimary }]}>{t("routines.title")}</Text>
      <Text style={[styles.description, { color: palette.textSecondary }]}>
        {t("routines.subtitle")}
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
