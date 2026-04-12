import { renderHook, waitFor } from "@testing-library/react-native";
import { usePaginatedExerciseLibrary } from "@/features/exercises/hooks/usePaginatedExerciseLibrary";

jest.mock("@/db/client", () => ({
  db: {
    select: jest.fn(),
  },
}));

jest.mock("@/db/schema", () => ({
  exercises: {
    id: "id",
    name: "name",
    muscleGroup: "muscleGroup",
    isCustom: "isCustom",
    searchPt: "searchPt",
    searchEn: "searchEn",
  },
  entityTranslations: {
    entityId: "entityId",
    entityType: "entityType",
    field: "field",
    locale: "locale",
    value: "value",
  },
}));

jest.mock("drizzle-orm", () => ({
  and: (...conditions: unknown[]) => ({ op: "and", conditions }),
  asc: (column: unknown) => ({ op: "asc", column }),
  eq: (column: unknown, value: unknown) => ({ op: "eq", column, value }),
  like: (column: unknown, value: unknown) => ({ op: "like", column, value }),
  notInArray: (column: unknown, values: unknown) => ({ op: "notInArray", column, values }),
  or: (...conditions: unknown[]) => ({ op: "or", conditions }),
}));

const mockDb = jest.requireMock("@/db/client").db as { select: jest.Mock };

function createQueryBuilder(result: Promise<unknown> | unknown) {
  const resultPromise = Promise.resolve(result);

  const builder: any = {
    from: jest.fn(() => builder),
    leftJoin: jest.fn(() => builder),
    where: jest.fn(() => builder),
    orderBy: jest.fn(() => builder),
    limit: jest.fn(() => builder),
    offset: jest.fn(() => builder),
    then: resultPromise.then.bind(resultPromise),
    catch: resultPromise.catch.bind(resultPromise),
    finally: resultPromise.finally.bind(resultPromise),
  };

  return builder;
}

describe("usePaginatedExerciseLibrary", () => {
  beforeEach(() => {
    mockDb.select.mockReset();
  });

  it("loads initial items with translations from single joined query", async () => {
    const joinedRows = [
      {
        id: "ex-1",
        name: "Bench Press",
        muscleGroup: "Chest",
        isCustom: true,
        translatedName: "Supino Reto",
      },
      {
        id: "ex-2",
        name: "Row",
        muscleGroup: "Back",
        isCustom: false,
        translatedName: null,
      },
    ];

    mockDb.select.mockReturnValue(
      createQueryBuilder(
        Promise.resolve(joinedRows).then((results) =>
          results.map((row) => ({
            id: row.id,
            name: row.translatedName ?? row.name,
            muscleGroup: row.muscleGroup,
            isCustom: row.isCustom,
          })),
        ),
      ),
    );

    const { result, unmount } = renderHook(() =>
      usePaginatedExerciseLibrary({
        query: "",
        locale: "pt-BR",
        excludeIds: [],
      }),
    );

    await waitFor(() => {
      expect(result.current.loadingInitial).toBe(false);
      expect(result.current.items).toHaveLength(2);
      expect(result.current.items[0]?.name).toBe("Supino Reto");
      expect(result.current.items[0]?.isCustom).toBe(true);
      expect(result.current.items[1]?.name).toBe("Row");
      expect(result.current.hasMore).toBe(false);
    });

    unmount();
  });
});
