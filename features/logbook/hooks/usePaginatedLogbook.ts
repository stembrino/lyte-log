import {
  getLogbookGymGroups,
  getLogbookRoutineGroups,
  getLogbookWorkoutsCount,
  getLogbookWorkoutsPage,
  LOGBOOK_PAGE_SIZE,
  type LogbookGymGroup,
  type LogbookRoutineGroup,
  type LogbookWorkoutItem,
} from "@/features/logbook/dao/queries/logbookQueries";
import { useApplyDefaultGymFilter } from "@/features/logbook/hooks/useApplyDefaultGymFilter";
import type { AppLocale } from "@/components/providers/i18n-provider";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export type LogbookGymFilterValue = "all" | "none" | string;
export type LogbookRoutineFilterValue = "all" | "none" | string;

type UsePaginatedLogbookResult = {
  items: LogbookWorkoutItem[];
  gymGroups: LogbookGymGroup[];
  routineGroups: LogbookRoutineGroup[];
  selectedGymFilter: LogbookGymFilterValue;
  selectedRoutineFilter: LogbookRoutineFilterValue;
  setSelectedGymFilter: (value: LogbookGymFilterValue) => void;
  setSelectedRoutineFilter: (value: LogbookRoutineFilterValue) => void;
  loadingInitial: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  loadMore: () => void;
  reload: () => Promise<void>;
};

function mapFilterToGymId(filter: LogbookGymFilterValue): string | null | undefined {
  if (filter === "all") {
    return undefined;
  }

  if (filter === "none") {
    return null;
  }

  return filter;
}

function mapFilterToRoutineId(filter: LogbookRoutineFilterValue): string | null | undefined {
  if (filter === "all") {
    return undefined;
  }

  if (filter === "none") {
    return null;
  }

  return filter;
}

export function usePaginatedLogbook(locale: AppLocale): UsePaginatedLogbookResult {
  const [items, setItems] = useState<LogbookWorkoutItem[]>([]);
  const [gymGroups, setGymGroups] = useState<LogbookGymGroup[]>([]);
  const [routineGroups, setRoutineGroups] = useState<LogbookRoutineGroup[]>([]);
  const [selectedGymFilter, setSelectedGymFilter] = useState<LogbookGymFilterValue>("all");
  const [selectedRoutineFilter, setSelectedRoutineFilter] =
    useState<LogbookRoutineFilterValue>("all");
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingInitial, setLoadingInitial] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const requestVersionRef = useRef(0);

  const selectedGymId = useMemo(() => mapFilterToGymId(selectedGymFilter), [selectedGymFilter]);
  const selectedRoutineId = useMemo(
    () => mapFilterToRoutineId(selectedRoutineFilter),
    [selectedRoutineFilter],
  );

  const fetchPage = useCallback(
    async (nextPage: number, reset: boolean) => {
      const requestVersion = ++requestVersionRef.current;

      if (reset) {
        setLoadingInitial(true);
      } else {
        setLoadingMore(true);
      }

      try {
        const [rows, totalCount, groups, routines] = await Promise.all([
          getLogbookWorkoutsPage({
            page: nextPage,
            gymId: selectedGymId,
            routineId: selectedRoutineId,
            locale,
          }),
          reset
            ? getLogbookWorkoutsCount({ gymId: selectedGymId, routineId: selectedRoutineId })
            : Promise.resolve(null),
          reset ? getLogbookGymGroups() : Promise.resolve(null),
          reset ? getLogbookRoutineGroups(locale) : Promise.resolve(null),
        ]);

        if (requestVersion !== requestVersionRef.current) {
          return;
        }

        setPage(nextPage);
        setItems((prev) => (reset ? rows : [...prev, ...rows]));

        if (groups) {
          setGymGroups(groups);
        }

        if (routines) {
          setRoutineGroups(routines);
        }

        if (totalCount !== null) {
          setHasMore((nextPage + 1) * LOGBOOK_PAGE_SIZE < totalCount);
        } else {
          setHasMore(rows.length === LOGBOOK_PAGE_SIZE);
        }
      } catch {
        if (requestVersion === requestVersionRef.current) {
          if (reset) {
            setItems([]);
            setGymGroups([]);
            setRoutineGroups([]);
          }
          setHasMore(false);
        }
      } finally {
        if (requestVersion === requestVersionRef.current) {
          setLoadingInitial(false);
          setLoadingMore(false);
        }
      }
    },
    [locale, selectedGymId, selectedRoutineId],
  );

  const reload = useCallback(async () => {
    setPage(0);
    setHasMore(true);
    setItems([]);
    await fetchPage(0, true);
  }, [fetchPage]);

  useEffect(() => {
    void reload();
  }, [reload]);

  useApplyDefaultGymFilter({ setSelectedGymFilter });

  const loadMore = useCallback(() => {
    if (loadingInitial || loadingMore || !hasMore) {
      return;
    }

    void fetchPage(page + 1, false);
  }, [fetchPage, hasMore, loadingInitial, loadingMore, page]);

  return {
    items,
    gymGroups,
    routineGroups,
    selectedGymFilter,
    selectedRoutineFilter,
    setSelectedGymFilter,
    setSelectedRoutineFilter,
    loadingInitial,
    loadingMore,
    hasMore,
    loadMore,
    reload,
  };
}
