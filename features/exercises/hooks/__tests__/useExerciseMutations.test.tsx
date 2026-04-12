import { renderHook } from "@testing-library/react-native";
import { useExerciseMutations } from "@/features/exercises/hooks/useExerciseMutations";

jest.mock("@/db/client", () => ({
  db: {
    select: jest.fn(),
    insert: jest.fn(),
    delete: jest.fn(),
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
}));

jest.mock("drizzle-orm", () => ({
  and: (...conditions: unknown[]) => ({ op: "and", conditions }),
  eq: (column: unknown, value: unknown) => ({ op: "eq", column, value }),
}));

const mockDb = jest.requireMock("@/db/client").db as {
  select: jest.Mock;
  insert: jest.Mock;
  delete: jest.Mock;
};

function createSelectBuilder(result: unknown) {
  const resultPromise = Promise.resolve(result);

  const builder: any = {
    from: jest.fn(() => builder),
    where: jest.fn(() => builder),
    limit: jest.fn(() => resultPromise),
    then: resultPromise.then.bind(resultPromise),
    catch: resultPromise.catch.bind(resultPromise),
    finally: resultPromise.finally.bind(resultPromise),
  };

  return builder;
}

describe("useExerciseMutations", () => {
  beforeEach(() => {
    mockDb.select.mockReset();
    mockDb.insert.mockReset();
    mockDb.delete.mockReset();
    jest.restoreAllMocks();
  });

  it("creates a custom exercise and reloads", async () => {
    const reload = jest.fn(async () => {});

    mockDb.select.mockReturnValue(createSelectBuilder([]));

    const insertValues = jest.fn(async () => {});
    mockDb.insert.mockReturnValue({
      values: insertValues,
    });

    jest.spyOn(Date, "now").mockReturnValue(12345);

    const { result } = renderHook(() => useExerciseMutations(reload));

    await result.current.createExercise({
      name: "  Bench Press  ",
      muscleGroup: "  Chest  ",
    });

    expect(insertValues).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "ex-custom-12345",
        name: "Bench Press",
        muscleGroup: "Chest",
        isCustom: true,
        searchPt: "bench press chest",
        searchEn: "bench press chest",
      }),
    );
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it("throws duplicate error and does not insert", async () => {
    const reload = jest.fn(async () => {});

    mockDb.select.mockReturnValue(createSelectBuilder([{ id: "ex-1" }]));

    const insertValues = jest.fn(async () => {});
    mockDb.insert.mockReturnValue({ values: insertValues });

    const { result } = renderHook(() => useExerciseMutations(reload));

    await expect(
      result.current.createExercise({
        name: "Bench Press",
        muscleGroup: "Chest",
      }),
    ).rejects.toThrow("duplicate_exercise");

    expect(insertValues).not.toHaveBeenCalled();
    expect(reload).not.toHaveBeenCalled();
  });

  it("deletes custom exercise and reloads", async () => {
    const reload = jest.fn(async () => {});

    const deleteWhere = jest.fn(async () => {});
    mockDb.delete.mockReturnValue({ where: deleteWhere });

    const { result } = renderHook(() => useExerciseMutations(reload));

    await result.current.deleteExercise("ex-custom-1");

    expect(mockDb.delete).toHaveBeenCalled();
    expect(deleteWhere).toHaveBeenCalledTimes(1);
    expect(reload).toHaveBeenCalledTimes(1);
  });
});
