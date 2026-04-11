export type SelectedRoutineExercise = {
  exerciseId: string;
  name: string;
  exerciseOrder: number;
  setsTarget: string;
  repsTarget: string;
};

export type RoutineGroupOption = {
  id: string;
  name: string;
  detail: string | null;
};
