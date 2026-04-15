import {
  getLogbookGymGroups,
  getLogbookWorkoutsCount,
  getLogbookWorkoutsPage,
  LOGBOOK_PAGE_SIZE,
  type LogbookGymGroup,
  type LogbookWorkoutItem,
} from "@/features/logbook/dao/queries/logbookQueries";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export type LogbookGymFilterValue = "all" | "none" | string;

type UsePaginatedLogbookResult = {
  items: LogbookWorkoutItem[];
  gymGroups: LogbookGymGroup[];
  selectedGymFilter: LogbookGymFilterValue;
  setSelectedGymFilter: (value: LogbookGymFilterValue) => void;
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

export function usePaginatedLogbook(): UsePaginatedLogbookResult {
  const [items, setItems] = useState<LogbookWorkoutItem[]>([]);
  const [gymGroups, setGymGroups] = useState<LogbookGymGroup[]>([]);
  const [selectedGymFilter, setSelectedGymFilter] = useState<LogbookGymFilterValue>("all");
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingInitial, setLoadingInitial] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const requestVersionRef = useRef(0);

  const selectedGymId = useMemo(() => mapFilterToGymId(selectedGymFilter), [selectedGymFilter]);

  const fetchPage = useCallback(
    async (nextPage: number, reset: boolean) => {
      const requestVersion = ++requestVersionRef.current;

      if (reset) {
        setLoadingInitial(true);
      } else {
        setLoadingMore(true);
      }

      try {
        const [rows, totalCount, groups] = await Promise.all([
          getLogbookWorkoutsPage({ page: nextPage, gymId: selectedGymId }),
          reset ? getLogbookWorkoutsCount({ gymId: selectedGymId }) : Promise.resolve(null),
          reset ? getLogbookGymGroups() : Promise.resolve(null),
        ]);

        if (requestVersion !== requestVersionRef.current) {
          return;
        }

        setPage(nextPage);
        setItems((prev) => (reset ? rows : [...prev, ...rows]));

        if (groups) {
          setGymGroups(groups);
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
    [selectedGymId],
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

  const loadMore = useCallback(() => {
    if (loadingInitial || loadingMore || !hasMore) {
      return;
    }

    void fetchPage(page + 1, false);
  }, [fetchPage, hasMore, loadingInitial, loadingMore, page]);

  return {
    items,
    gymGroups,
    selectedGymFilter,
    setSelectedGymFilter,
    loadingInitial,
    loadingMore,
    hasMore,
    loadMore,
    reload,
  };
}
