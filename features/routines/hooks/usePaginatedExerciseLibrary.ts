import type { AppLocale } from "@/components/providers/i18n-provider";
import { db } from "@/db/client";
import { entityTranslations, exercises } from "@/db/schema";
import { and, asc, eq, inArray, like, notInArray, or } from "drizzle-orm";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const PAGE_SIZE = 20;

export type ExerciseLibraryItem = {
  id: string;
  name: string;
  muscleGroup: string;
};

type UsePaginatedExerciseLibraryParams = {
  query: string;
  locale: AppLocale;
  excludeIds: string[];
};

export function usePaginatedExerciseLibrary({
  query,
  locale,
  excludeIds,
}: UsePaginatedExerciseLibraryParams) {
  const [items, setItems] = useState<ExerciseLibraryItem[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingInitial, setLoadingInitial] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState(query);

  const requestVersionRef = useRef(0);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedQuery(query);
    }, 250);

    return () => clearTimeout(timeout);
  }, [query]);

  const normalizedQuery = useMemo(() => debouncedQuery.trim().toLowerCase(), [debouncedQuery]);
  const excludeKey = useMemo(() => [...excludeIds].sort().join("|"), [excludeIds]);

  const fetchPage = useCallback(
    async (nextPage: number, reset: boolean) => {
      const requestVersion = ++requestVersionRef.current;

      if (reset) {
        setLoadingInitial(true);
      } else {
        setLoadingMore(true);
      }

      try {
        const searchColumn = locale === "pt-BR" ? exercises.searchPt : exercises.searchEn;
        const conditions = [] as (ReturnType<typeof like> | ReturnType<typeof notInArray>)[];

        if (normalizedQuery) {
          conditions.push(
            or(
              like(searchColumn, `%${normalizedQuery}%`),
              like(exercises.name, `%${normalizedQuery}%`),
              like(exercises.muscleGroup, `%${normalizedQuery}%`),
            )!,
          );
        }

        if (excludeIds.length > 0) {
          conditions.push(notInArray(exercises.id, excludeIds));
        }

        const whereClause =
          conditions.length === 0
            ? undefined
            : conditions.length === 1
              ? conditions[0]
              : and(...conditions);

        const baseQuery = db
          .select({
            id: exercises.id,
            name: exercises.name,
            muscleGroup: exercises.muscleGroup,
          })
          .from(exercises)
          .orderBy(asc(exercises.name))
          .limit(PAGE_SIZE)
          .offset(nextPage * PAGE_SIZE);

        const baseRows = whereClause ? await baseQuery.where(whereClause) : await baseQuery;

        const translationRows =
          baseRows.length === 0
            ? []
            : await db
                .select({
                  entityId: entityTranslations.entityId,
                  value: entityTranslations.value,
                })
                .from(entityTranslations)
                .where(
                  and(
                    eq(entityTranslations.entityType, "exercise"),
                    eq(entityTranslations.field, "name"),
                    eq(entityTranslations.locale, locale),
                    inArray(
                      entityTranslations.entityId,
                      baseRows.map((row) => row.id),
                    ),
                  ),
                );

        const translationMap = new Map(translationRows.map((row) => [row.entityId, row.value]));

        const rows = baseRows.map((row) => ({
          id: row.id,
          name: translationMap.get(row.id) ?? row.name,
          muscleGroup: row.muscleGroup,
        }));

        if (requestVersion !== requestVersionRef.current) {
          return;
        }

        setHasMore(rows.length === PAGE_SIZE);
        setPage(nextPage);
        setItems((prev) => (reset ? rows : [...prev, ...rows]));
      } catch {
        if (requestVersion !== requestVersionRef.current) {
          return;
        }

        setHasMore(false);
        if (reset) {
          setItems([]);
        }
      } finally {
        if (requestVersion === requestVersionRef.current) {
          setLoadingInitial(false);
          setLoadingMore(false);
        }
      }
    },
    [excludeIds, locale, normalizedQuery],
  );

  useEffect(() => {
    setPage(0);
    setHasMore(true);
    setItems([]);
    fetchPage(0, true);
  }, [fetchPage, excludeKey]);

  const loadMore = useCallback(() => {
    if (loadingInitial || loadingMore || !hasMore) {
      return;
    }

    fetchPage(page + 1, false);
  }, [fetchPage, hasMore, loadingInitial, loadingMore, page]);

  return {
    items,
    hasMore,
    loadingInitial,
    loadingMore,
    loadMore,
  };
}
