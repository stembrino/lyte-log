import { useCallback, useEffect, useRef } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { getDefaultGymId } from "@/features/workouts/dao/queries/gymQueries";

type UseApplyDefaultGymFilterArgs = {
  selectedGymFilter: string;
  setSelectedGymFilter: (value: string) => void;
  onGymFilterAutoApplied?: () => void;
};

export function useApplyDefaultGymFilter({
  selectedGymFilter,
  setSelectedGymFilter,
  onGymFilterAutoApplied,
}: UseApplyDefaultGymFilterArgs): void {
  const autoAppliedGymIdRef = useRef<string | null>(null);

  const syncDefaultGymFilter = useCallback(async () => {
    const defaultGymId = await getDefaultGymId();

    // Only auto-apply when the current filter is still auto-managed.
    const canAutoApplyFromInitialAll =
      selectedGymFilter === "all" && autoAppliedGymIdRef.current === null;
    const canAutoApplyFromPreviouslyApplied = selectedGymFilter === autoAppliedGymIdRef.current;
    const canAutoApply = canAutoApplyFromInitialAll || canAutoApplyFromPreviouslyApplied;

    if (!canAutoApply) {
      return;
    }

    if (!defaultGymId) {
      if (selectedGymFilter === autoAppliedGymIdRef.current && selectedGymFilter !== "all") {
        autoAppliedGymIdRef.current = null;
        setSelectedGymFilter("all");
        onGymFilterAutoApplied?.();
      }
      return;
    }

    if (selectedGymFilter !== defaultGymId) {
      autoAppliedGymIdRef.current = defaultGymId;
      setSelectedGymFilter(defaultGymId);
      onGymFilterAutoApplied?.();
      return;
    }

    autoAppliedGymIdRef.current = defaultGymId;
  }, [onGymFilterAutoApplied, selectedGymFilter, setSelectedGymFilter]);

  useEffect(() => {
    void syncDefaultGymFilter();
  }, [syncDefaultGymFilter]);

  useFocusEffect(
    useCallback(() => {
      void syncDefaultGymFilter();
    }, [syncDefaultGymFilter]),
  );
}
