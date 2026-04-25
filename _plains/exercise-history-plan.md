# Exercise History — Where, When & How To Show

## Objetivo

Mostrar ao usuário o histórico de performance por exercício — sem gráficos — de forma que os números exatos sejam sempre visíveis e comparáveis.

---

## As três superfícies possíveis

### Superfície A — Preparar Treino ("última vez")

**Onde:** `PrepareWorkoutScreen` → `PrepareWorkoutExercisesForm`  
**Quando:** Ao preparar um treino com uma rotina selecionada  
**O que mostrar:** Para cada exercício da lista, uma linha discreta abaixo do nome:

```
SUPINO RETO
sets: [3]   reps: [8]
última vez: 60kg × 8 × 3 sets  —  há 6 dias
```

**Prós:**

- Contexto máximo — o usuário está prestes a treinar e pode ajustar a meta
- Não precisa de navegação extra
- Natural: "o que fiz da última vez?"

**Contras:**

- Requer uma query extra por exercício ao carregar a tela (ou uma query única com todos os exerciseIds da rotina)
- Só aparece quando se usa uma rotina; se o treino for livre sem rotina, não ajuda

**Complexidade:** Baixa — uma query nova `getLastWorkoutSetsByExercises(exerciseIds[])` que retorna o último workout_set por exercício. Sem mudança de schema.

---

### Superfície B — Aba Performance (histórico como lista)

**Onde:** `app/(tabs)/performance.tsx` — tela dedicada  
**Quando:** Usuário navega para a aba Performance, seleciona um exercício  
**O que mostrar:** Lista cronológica reversa dos treinos onde aquele exercício apareceu:

```
24 abr 2026
  Set 1  60kg × 8   ✓
  Set 2  60kg × 8   ✓
  Set 3  57.5kg × 6  ✓

18 abr 2026
  Set 1  57.5kg × 8  ✓
  Set 2  57.5kg × 8  ✓
  Set 3  57.5kg × 8  ✓
```

Opcionalmente: totais por sessão (volume = soma de carga × reps).

**Prós:**

- Histórico completo e legível
- Números exatos visíveis, diferenças de 1.5kg são evidentes
- Naturalmente paginável

**Contras:**

- Requer seletor de exercício antes de mostrar dados
- Mais uma tela para o usuário descobrir

**Complexidade:** Média — query nova `getExerciseHistory(exerciseId, filters)`, componente de seletor de exercício (pode reusar o picker existente), componente de lista de sessões.

---

### Superfície C — Delta no Logbook card

**Onde:** `LogbookWorkoutCard` — linha de cada exercício  
**Quando:** Ao ver o histórico de treinos no Logbook  
**O que mostrar:** Ao lado do exercício, comparar com o workout anterior:

```
SUPINO RETO    60kg × 8 × 3   ▲ +2.5kg vs anterior
AGACHAMENTO    80kg × 5 × 4   = igual
```

**Prós:**

- Zero navegação extra — está no fluxo de revisão que o usuário já usa
- Feedback imediato no contexto certo (revisar o que fez)

**Contras:**

- Mais pesado para o logbook — requer join ou lookup com workout anterior por exercício
- Adiciona ruído ao card se o usuário não quiser comparar agora
- Lógica de diff mais complexa (e se trocou de peso? E se fez sets diferentes?)

**Complexidade:** Alta relativa — exige query de "workout anterior com aquele exercício" para cada card visível, com lógica de comparação de sets.

---

## Ordem de prioridade sugerida

| Fase | Superfície                            | Motivo                                                    |
| ---- | ------------------------------------- | --------------------------------------------------------- |
| 1    | **A — Última vez no Preparar Treino** | Máxima utilidade, mínima complexidade, contexto ideal     |
| 2    | **B — Aba Performance (lista)**       | Histórico completo para quem quer analisar mais           |
| 3    | **C — Delta no Logbook**              | Complemento visual, mas mais custoso e pode poluir o card |

---

## Dados necessários por superfície

### Superfície A

Nova query: `getLastSetsByExercises(exerciseIds: string[]): Map<exerciseId, SetSummary>`

```ts
type SetSummary = {
  workoutDate: string; // para "há N dias"
  totalSets: number;
  maxWeight: number; // carga máxima usada
  representativeReps: number; // reps do set com maior carga
};
```

- Busca via JOIN: `workout_sets` → `workouts` onde `workouts.status = 'completed'`
- Ordenado por `workouts.date DESC`, pega o mais recente por exercício
- Agrupado por `exerciseId`

### Superfície B

Nova query: `getExerciseHistory(exerciseId: string, page: number): ExerciseHistorySession[]`

```ts
type ExerciseHistorySession = {
  workoutId: string;
  workoutDate: string;
  gymName: string | null;
  sets: {
    setOrder: number;
    reps: number;
    weight: number;
    completed: boolean;
  }[];
  totalVolume: number; // soma weight × reps dos sets completed
};
```

### Superfície C

Extende o `LogbookWorkoutItem` com dados de comparação ou faz lookup on-demand.  
Decisão de implementação: deixar para quando A e B estiverem prontos.

---

## Notas de UX

- Sem gráficos — diferenças de 1.5kg são invisíveis em escala. Números exatos sempre.
- "Última vez" deve mostrar a data de forma relativa ("há 6 dias") não absoluta, para dar senso de ritmo.
- Volume total (kg × reps) pode ser mostrado como número secundário — útil mesmo sem gráfico.
- Se o usuário nunca treinou aquele exercício antes, não mostrar nada (não "0" ou "—", simplesmente omitir a linha).

---

## Arquivos que serão criados/modificados (estimativa)

### Fase 1 — Superfície A

- `features/workouts/dao/queries/workoutSetQueries.ts` — nova query `getLastSetsByExercises`
- `features/workouts/hooks/useLastExerciseSets.ts` — hook para usar na tela de preparar
- `features/workouts/PrepareWorkoutScreen.tsx` — passa dados para o form
- `features/workouts/components/prepare/PrepareWorkoutExercisesForm.tsx` — mostra "última vez"

### Fase 2 — Superfície B

- `features/workouts/dao/queries/workoutSetQueries.ts` — nova query `getExerciseHistory`
- `features/workouts/hooks/useExerciseHistory.ts`
- `app/(tabs)/performance.tsx` — tela principal com seletor + lista
- `features/workouts/components/performance/ExerciseHistoryList.tsx`
- `features/workouts/components/performance/ExerciseHistorySession.tsx`
