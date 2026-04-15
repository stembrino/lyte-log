import { Chip } from "@/components/Chip";
import { useRetroPalette } from "@/components/hooks/useRetroPalette";
import { useI18n } from "@/components/providers/i18n-provider";
import { monoFont } from "@/constants/retroTheme";
import {
  type LogbookGymFilterValue,
  usePaginatedLogbook,
} from "@/features/logbook/hooks/usePaginatedLogbook";
import { softDeleteWorkout } from "@/features/workouts/dao/mutations/workoutMutations";
import { useCallback, useMemo } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { LogbookWorkoutCard } from "./components/LogbookWorkoutCard";

type GroupedWorkouts = {
  key: string;
  label: string;
  items: ReturnType<typeof usePaginatedLogbook>["items"];
};

export function LogbookTabScreen() {
  const palette = useRetroPalette();
  const { t, locale } = useI18n();
  const {
    items,
    gymGroups,
    selectedGymFilter,
    setSelectedGymFilter,
    loadingInitial,
    loadingMore,
    hasMore,
    loadMore,
    reload,
  } = usePaginatedLogbook();

  const handleDeletePress = useCallback(
    (workoutId: string) => {
      Alert.alert(t("performance.logbookDeleteTitle"), t("performance.logbookDeleteBody"), [
        { text: t("exercises.cancel"), style: "cancel" },
        {
          text: t("performance.logbookDeleteConfirm"),
          style: "destructive",
          onPress: () => {
            void softDeleteWorkout(workoutId).then(() => reload());
          },
        },
      ]);
    },
    [t, reload],
  );

  const totalCount = useMemo(() => {
    return gymGroups.reduce((sum, row) => sum + row.workoutsCount, 0);
  }, [gymGroups]);

  const filterOptions = useMemo(() => {
    const options: { value: LogbookGymFilterValue; label: string }[] = [
      {
        value: "all",
        label: `${t("performance.logbookAllGymsFilter")} (${totalCount})`,
      },
    ];

    for (const group of gymGroups) {
      options.push({
        value: group.gymId ?? "none",
        label: `${
          group.gymName?.trim() || t("performance.logbookNoGymFilter")
        } (${group.workoutsCount})`,
      });
    }

    return options;
  }, [gymGroups, t, totalCount]);

  const groupedWorkouts = useMemo(() => {
    const groups = new Map<string, GroupedWorkouts>();

    for (const item of items) {
      const key = item.gym?.id ?? "none";
      const existing = groups.get(key);

      if (existing) {
        existing.items.push(item);
        continue;
      }

      groups.set(key, {
        key,
        label: item.gym?.name || t("performance.logbookNoGymGroup"),
        items: [item],
      });
    }

    return Array.from(groups.values());
  }, [items, t]);

  return (
    <View style={[styles.container, { backgroundColor: palette.page }]}>
      <View style={styles.headerWrap}>
        <Text style={[styles.subtitle, { color: palette.textSecondary }]}>
          {t("performance.logbookSubtitle")}
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filtersScrollView}
        contentContainerStyle={styles.filtersRow}
      >
        {filterOptions.map((option) => (
          <Chip
            key={String(option.value)}
            label={option.label}
            selected={selectedGymFilter === option.value}
            onPress={() => setSelectedGymFilter(option.value)}
          />
        ))}
      </ScrollView>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {loadingInitial ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={palette.accent} />
            <Text style={[styles.loadingText, { color: palette.textSecondary }]}>
              {t("performance.logbookLoading")}
            </Text>
          </View>
        ) : null}

        {!loadingInitial && groupedWorkouts.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Text style={[styles.emptyTitle, { color: palette.textPrimary }]}>
              {t("performance.logbookEmptyTitle")}
            </Text>
            <Text style={[styles.emptyBody, { color: palette.textSecondary }]}>
              {t("performance.logbookEmptyBody")}
            </Text>
          </View>
        ) : null}

        {!loadingInitial
          ? groupedWorkouts.map((group) => (
              <View key={group.key} style={styles.groupWrap}>
                <Text style={[styles.groupTitle, { color: palette.accent }]}>{group.label}</Text>
                <View style={styles.cardsCol}>
                  {group.items.map((item) => (
                    <LogbookWorkoutCard
                      key={item.id}
                      item={item}
                      locale={locale}
                      durationLabel={t("performance.logbookCardDuration")}
                      exercisesLabel={t("performance.logbookCardExercises")}
                      setsLabel={t("performance.logbookCardSets")}
                      completedLabel={t("performance.logbookCardCompleted")}
                      totalLoadLabel={t("performance.logbookCardTotalLoad")}
                      noSetDetailsLabel={t("performance.logbookCardNoSetDetails")}
                      onDelete={handleDeletePress}
                    />
                  ))}
                </View>
              </View>
            ))
          : null}

        {!loadingInitial && hasMore ? (
          <TouchableOpacity
            style={[
              styles.loadMoreButton,
              { borderColor: palette.border, backgroundColor: palette.card },
            ]}
            onPress={loadMore}
            disabled={loadingMore}
            activeOpacity={0.8}
          >
            <Text style={[styles.loadMoreText, { color: palette.textPrimary }]}>
              {loadingMore ? t("performance.logbookLoading") : t("performance.logbookLoadMore")}
            </Text>
          </TouchableOpacity>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  headerWrap: {
    gap: 4,
    marginBottom: 10,
  },
  subtitle: {
    fontFamily: monoFont,
    fontSize: 11,
    letterSpacing: 0.2,
  },
  filtersScrollView: {
    flexGrow: 0,
    flexShrink: 0,
    marginBottom: 8,
  },
  filtersRow: {
    gap: 8,
    paddingRight: 10,
  },
  content: {
    paddingTop: 2,
    paddingBottom: 24,
    gap: 12,
    justifyContent: "flex-start",
    alignItems: "stretch",
  },
  loadingWrap: {
    paddingVertical: 16,
    alignItems: "center",
    gap: 8,
  },
  loadingText: {
    fontFamily: monoFont,
    fontSize: 11,
    letterSpacing: 0.2,
  },
  emptyWrap: {
    borderWidth: 1,
    borderRadius: 2,
    paddingHorizontal: 12,
    paddingVertical: 14,
    gap: 6,
  },
  emptyTitle: {
    fontFamily: monoFont,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  emptyBody: {
    fontFamily: monoFont,
    fontSize: 11,
    letterSpacing: 0.2,
  },
  groupWrap: {
    gap: 8,
  },
  groupTitle: {
    fontFamily: monoFont,
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  cardsCol: {
    gap: 8,
  },
  loadMoreButton: {
    minHeight: 40,
    borderWidth: 1,
    borderRadius: 2,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
    marginTop: 4,
  },
  loadMoreText: {
    fontFamily: monoFont,
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
});
