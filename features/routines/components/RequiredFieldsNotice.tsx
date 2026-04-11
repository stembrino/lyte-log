import { monoFont } from "@/constants/retroTheme";
import { StyleSheet, Text, View } from "react-native";

type RequiredFieldsNoticeProps = {
  title: string;
  fields: string[];
  borderColor: string;
  backgroundColor: string;
  titleColor: string;
  textColor: string;
};

export function RequiredFieldsNotice({
  title,
  fields,
  borderColor,
  backgroundColor,
  titleColor,
  textColor,
}: RequiredFieldsNoticeProps) {
  if (fields.length === 0) {
    return null;
  }

  return (
    <View
      accessibilityRole="alert"
      style={[
        styles.container,
        {
          borderColor,
          backgroundColor,
        },
      ]}
    >
      <Text style={[styles.title, { color: titleColor }]}>{title}</Text>
      {fields.map((field) => (
        <Text key={field} style={[styles.item, { color: textColor }]}>
          - {field}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: 2,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 6,
  },
  title: {
    fontFamily: monoFont,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  item: {
    fontFamily: monoFont,
    fontSize: 12,
    letterSpacing: 0.2,
  },
});
