import FontAwesome from "@expo/vector-icons/FontAwesome";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { Tabs } from "expo-router";
import React from "react";
import { Pressable, Text, View } from "react-native";

import { useClientOnlyValue } from "@/components/hooks/useClientOnlyValue";
import { useColorScheme } from "@/components/hooks/useColorScheme";
import { useI18n } from "@/components/providers/i18n-provider";
import { useThemePreference } from "@/components/theme-preference";
import Colors from "@/constants/Colors";
import { FEATURE_FLAGS } from "@/constants/featureFlags";
import { monoFont } from "@/constants/retroTheme";

// You can explore the built-in icon families and icons on the web at https://icons.expo.fyi/
function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>["name"];
  color: string;
}) {
  return <FontAwesome size={28} style={{ marginBottom: -3 }} {...props} />;
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { toggleTheme } = useThemePreference();
  const { locale, toggleLocale, t } = useI18n();
  const isDarkTheme = colorScheme === "dark";

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
        tabBarInactiveTintColor: Colors[colorScheme ?? "light"].tabIconDefault,
        tabBarStyle: {
          backgroundColor: Colors[colorScheme ?? "light"].background,
          borderTopColor: colorScheme === "dark" ? "#404040" : "#D1D5DB",
          borderTopWidth: 1,
        },
        tabBarLabelStyle: {
          fontFamily: monoFont,
          fontSize: 11,
          textTransform: "uppercase",
          letterSpacing: 0.8,
        },
        headerStyle: {
          backgroundColor: Colors[colorScheme ?? "light"].background,
        },
        headerTitleStyle: {
          fontFamily: monoFont,
          textTransform: "uppercase",
          letterSpacing: 0.8,
          color: Colors[colorScheme ?? "light"].text,
        },
        // Disable the static render of the header on web
        // to prevent a hydration error in React Navigation v6.
        headerShown: useClientOnlyValue(false, true),
        headerRight: () => (
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Pressable
              onPress={toggleTheme}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel={isDarkTheme ? t("header.themeToLight") : t("header.themeToDark")}
            >
              {({ pressed }) => (
                <FontAwesome
                  name={isDarkTheme ? "sun-o" : "moon-o"}
                  size={22}
                  color={Colors[colorScheme ?? "light"].text}
                  style={{ marginRight: 16, opacity: pressed ? 0.5 : 1 }}
                />
              )}
            </Pressable>
            <Pressable
              onPress={toggleLocale}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel={t("header.language")}
            >
              {({ pressed }) => (
                <View
                  style={{
                    marginRight: 15,
                    borderWidth: 1,
                    borderColor: Colors[colorScheme ?? "light"].text,
                    borderRadius: 2,
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    opacity: pressed ? 0.5 : 1,
                  }}
                >
                  <Text
                    style={{
                      color: Colors[colorScheme ?? "light"].text,
                      fontFamily: monoFont,
                      fontWeight: "700",
                      fontSize: 12,
                      textTransform: "uppercase",
                    }}
                  >
                    {locale === "pt-BR" ? "PT" : "EN"}
                  </Text>
                </View>
              )}
            </Pressable>
          </View>
        ),
      }}
    >
      <Tabs.Screen
        name="workouts"
        options={{
          title: t("tabs.workout"),
          tabBarIcon: ({ color }) => <TabBarIcon name="bolt" color={color} />,
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="routines"
        options={{
          title: t("tabs.routines"),
          tabBarIcon: ({ color }) => <TabBarIcon name="tasks" color={color} />,
        }}
      />
      <Tabs.Screen
        name="exercises"
        options={{
          href: FEATURE_FLAGS.exercisesTab ? undefined : null,
          title: t("tabs.exercises"),
          tabBarIcon: ({ color }) => (
            <FontAwesome6 name="dumbbell" size={24} color={color} style={{ marginBottom: -3 }} />
          ),
        }}
      />
      <Tabs.Screen
        name="performance"
        options={{
          title: t("tabs.performance"),
          tabBarIcon: ({ color }) => <TabBarIcon name="book" color={color} />,
        }}
      />
    </Tabs>
  );
}
