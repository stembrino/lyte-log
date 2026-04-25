import { createGym, getGyms, type GymItem } from "@/features/workouts/dao/queries/gymQueries";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type UseGymPickerOptions = {
  autoSelectDefault?: boolean;
};

type UseGymPickerResult = {
  gyms: GymItem[];
  selectedGymId: string | null;
  selectedGym: GymItem | null;
  loading: boolean;
  setSelectedGymId: (gymId: string | null) => void;
  addGym: (name: string) => Promise<void>;
  reload: () => Promise<void>;
};

function pickDefaultGymId(items: GymItem[]): string | null {
  const defaultGym = items.find((gym) => gym.isDefault);
  return defaultGym?.id ?? null;
}

export function useGymPicker(options?: UseGymPickerOptions): UseGymPickerResult {
  const [gyms, setGyms] = useState<GymItem[]>([]);
  const [selectedGymId, setSelectedGymId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const hasAutoSelectedRef = useRef(false);
  const autoSelectDefault = options?.autoSelectDefault ?? true;

  const reload = useCallback(async () => {
    setLoading(true);

    try {
      const rows = await getGyms();
      setGyms(rows);

      if (autoSelectDefault && !hasAutoSelectedRef.current) {
        const defaultGymId = pickDefaultGymId(rows);
        setSelectedGymId(defaultGymId);
        hasAutoSelectedRef.current = true;
      }
    } finally {
      setLoading(false);
    }
  }, [autoSelectDefault]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const addGym = useCallback(async (name: string) => {
    const created = await createGym(name);
    const rows = await getGyms();
    setGyms(rows);
    setSelectedGymId(created.id);
    hasAutoSelectedRef.current = true;
  }, []);

  const selectedGym = useMemo(
    () => gyms.find((gym) => gym.id === selectedGymId) ?? null,
    [gyms, selectedGymId],
  );

  return {
    gyms,
    selectedGymId,
    selectedGym,
    loading,
    setSelectedGymId,
    addGym,
    reload,
  };
}
