import { StyleSheet, Text, View } from "react-native";

import { monoFont } from "@/constants/retroTheme";

type SettingsSectionProps = {
  title: string;
  textColor: string;
  borderColor: string;
  children: React.ReactNode;
};

export function SettingsSection({ title, textColor, borderColor, children }: SettingsSectionProps) {
  return (
    <View style={[styles.section, { borderBottomColor: borderColor }]}>
      <Text style={[styles.sectionTitle, { color: textColor }]}>{title}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  sectionTitle: {
    fontFamily: monoFont,
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 12,
  },
});
