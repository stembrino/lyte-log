import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useState } from "react";
import * as StoreReview from "expo-store-review";

import { useColorScheme } from "@/components/hooks/useColorScheme";
import { useGlobalAlert } from "@/components/hooks/useGlobalAlert";
import { useRetroPalette } from "@/components/hooks/useRetroPalette";
import { useI18n } from "@/components/providers/i18n-provider";
import Colors from "@/constants/Colors";
import { monoFont } from "@/constants/retroTheme";

export function RateAppSettingRow() {
  const colorScheme = useColorScheme();
  const palette = useRetroPalette();
  const { t } = useI18n();
  const { showAlert, alertElement } = useGlobalAlert();
  const [requestingReview, setRequestingReview] = useState(false);
  const textColor = Colors[colorScheme ?? "light"].text;

  const handleRequestReview = () => {
    if (requestingReview) {
      return;
    }

    void (async () => {
      setRequestingReview(true);

      try {
        const isAvailable = await StoreReview.isAvailableAsync();

        if (!isAvailable) {
          showAlert({
            title: t("settings.rateAppUnavailableTitle"),
            message: t("settings.rateAppUnavailableBody"),
            buttonLabel: t("workouts.postFinishCloseCta"),
          });
          return;
        }

        await StoreReview.requestReview();
      } catch {
        showAlert({
          title: t("settings.rateAppUnavailableTitle"),
          message: t("settings.rateAppUnavailableBody"),
          buttonLabel: t("workouts.postFinishCloseCta"),
        });
      } finally {
        setRequestingReview(false);
      }
    })();
  };

  return (
    <>
      <Pressable style={styles.settingRow} onPress={handleRequestReview}>
        <View style={styles.settingContent}>
          <FontAwesome name="star-o" size={18} color={palette.accent} style={{ marginRight: 12 }} />
          <Text style={[styles.settingLabel, { color: textColor }]}>{t("settings.rateApp")}</Text>
        </View>
        <Text style={[styles.settingValue, { color: palette.textSecondary }]}>
          {requestingReview ? t("routines.loading") : t("settings.rateAppAction")}
        </Text>
      </Pressable>

      {alertElement}
    </>
  );
}

const styles = StyleSheet.create({
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  settingContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  settingLabel: {
    fontFamily: monoFont,
    fontSize: 12,
    fontWeight: "600",
  },
  settingValue: {
    fontFamily: monoFont,
    fontSize: 11,
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
});
