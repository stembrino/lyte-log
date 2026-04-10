# Create Routine Form – UX Options

> **Goal**: Design a friendly, non-confusing form to create a new routine.  
> **Entry Point**: "Add Routine" button in routines tab → opens modal/screen

---

## Option 1: "Simple & Linear" (Step-by-Step Wizard)

**Vibe**: One thing at a time. Less overwhelming.

```
┌─────────────────────────────────────┐
│ ✕  Create Routine (Step 1 of 3)     │
├─────────────────────────────────────┤
│                                     │
│  What's the routine name?           │
│  ┌─────────────────────────────┐    │
│  │ e.g., Upper Body Day        │    │
│  └─────────────────────────────┘    │
│                                     │
│                                     │
│  [Cancel]                  [Next →] │
└─────────────────────────────────────┘

--- Then Screen 2 ---

┌─────────────────────────────────────┐
│ ✕  Create Routine (Step 2 of 3)     │
├─────────────────────────────────────┤
│                                     │
│  How long (approx)?                 │
│  ┌─────────────────────────────┐    │
│  │ 45  minutes                 │    │
│  └─────────────────────────────┘    │
│                                     │
│  [← Back]                  [Next →] │
└─────────────────────────────────────┘

--- Then Screen 3 ---

┌─────────────────────────────────────┐
│ ✕  Create Routine (Step 3 of 3)     │
├─────────────────────────────────────┤
│                                     │
│  Pick tags (optional):              │
│  ☑ Strength                         │
│  ☐ Cardio                           │
│  ☐ Stretching                       │
│  ☐ Recovery                         │
│                                     │
│  [← Back]               [Create] ✓  │
└─────────────────────────────────────┘
```

**Pros**: Less cognitive load, progressive, feels guided.  
**Cons**: More taps to create routine; exercises added _after_ creation (separate step).

---

## Option 2: "All-In-One" (Single Page Form)

**Vibe**: Everything visible, traditional form feel.

```
┌─────────────────────────────────────┐
│ ✕  Create Routine                   │
├─────────────────────────────────────┤
│                                     │
│  Routine Name *                     │
│  ┌─────────────────────────────┐    │
│  │ Upper Body Day              │    │
│  └─────────────────────────────┘    │
│                                     │
│  Duration (min)                     │
│  ┌─────────────────────────────┐    │
│  │ 45                          │    │
│  └─────────────────────────────┘    │
│                                     │
│  Tags (optional)                    │
│  ☑ Strength  ☐ Cardio              │
│  ☐ Stretching  ☐ Recovery          │
│                                     │
│  [Cancel]                [Create] ✓ │
└─────────────────────────────────────┘
```

**Pros**: Fast, all info at once, familiar form pattern.  
**Cons**: Can feel cramped; exercises still added separately.

---

## Option 3: "Card-Based + Add Exercises" (Hybrid)

**Vibe**: Friendly, visual, lets user add exercises while creating.

```
┌─────────────────────────────────────┐
│ ✕  Create Routine                   │
├─────────────────────────────────────┤
│                                     │
│  ┌─ Routine Info ──────────────┐    │
│  │ Routine Name *              │    │
│  │ ┌──────────────────────┐    │    │
│  │ │ Upper Body Day       │    │    │
│  │ └──────────────────────┘    │    │
│  │                             │    │
│  │ Duration (min)              │    │
│  │ ┌──────────────────────┐    │    │
│  │ │ 45                   │    │    │
│  │ └──────────────────────┘    │    │
│  │                             │    │
│  │ Tags (optional)             │    │
│  │ ☑ Strength  ☐ Cardio       │    │
│  └─────────────────────────────┘    │
│                                     │
│  ┌─ Exercises (Optional) ───────┐   │
│  │ + Add Exercise              │   │
│  │                             │   │
│  │ You can add more after!     │   │
│  └─────────────────────────────┘    │
│                                     │
│  [Cancel]                [Create] ✓ │
└─────────────────────────────────────┘
```

**Pros**: Visual, grouped info, exercises optional at creation.  
**Cons**: Still requires post-creation to manage exercises.

---

## Option 4: "Simple Two-Screen" (Recommended for your case)

**Vibe**: Balanced, friendly, minimal but complete.

```
SCREEN 1: Basic Info
┌─────────────────────────────────────┐
│ ✕  Create Routine                   │
├─────────────────────────────────────┤
│                                     │
│  Routine Name *                     │
│  ┌─────────────────────────────┐    │
│  │ Upper Body Day              │    │
│  └─────────────────────────────┘    │
│                                     │
│  Duration (min) - optional          │
│  ┌─────────────────────────────┐    │
│  │ 45                          │    │
│  └─────────────────────────────┘    │
│                                     │
│  Tags - optional                    │
│  ☑ Strength                         │
│  ☐ Cardio                           │
│  ☐ Stretching                       │
│                                     │
│  [Cancel]                  [Next →] │
└─────────────────────────────────────┘

SCREEN 2: Exercises (Optional)
┌─────────────────────────────────────┐
│ ✕  Add Exercises (Step 2)           │
├─────────────────────────────────────┤
│                                     │
│  Add exercises to this routine:     │
│  (You can also add them later!)     │
│                                     │
│  + Add First Exercise               │
│                                     │
│  ┌─ Exercise ───────────────────┐   │
│  │ Bench Press                   │   │
│  │ Sets: 4 | Reps: 8-10         │   │
│  │            [Remove]           │   │
│  └───────────────────────────────┘   │
│                                     │
│  + Add Another Exercise             │
│                                     │
│  [← Back]               [Create] ✓  │
└─────────────────────────────────────┘
```

**Pros**: Clean, not overwhelming, exercises as bonus (not required).  
**Cons**: Two screens (but clear progress).

---

## Option 5: "Minimal" (Bare Essential)

**Vibe**: Just the essentials, super fast.

```
┌─────────────────────────────────────┐
│ ✕  New Routine                      │
├─────────────────────────────────────┤
│                                     │
│  Name:                              │
│  ┌─────────────────────────────┐    │
│  │ Upper Body Day              │    │
│  └─────────────────────────────┘    │
│                                     │
│  Duration (optional):               │
│  ┌─────────────────────────────┐    │
│  │ 45 min                      │    │
│  └─────────────────────────────┘    │
│                                     │
│  Tags (optional):                   │
│  ☑ Strength  ☐ Cardio              │
│                                     │
│  [Cancel]                [Create] ✓ │
└─────────────────────────────────────┘
```

**Pros**: Super fast, minimal, exercises added after.  
**Cons**: Very basic, might feel too minimal.

---

## Comparison Table

| Option        | Complexity | Friendliness | Speed     | Exercises | Best For         |
| ------------- | ---------- | ------------ | --------- | --------- | ---------------- |
| 1. Wizard     | 🟢 Low     | 🟢 High      | 🔴 Slow   | After     | First-time users |
| 2. All-in-One | 🟡 Medium  | 🟡 Medium    | 🟢 Fast   | After     | Power users      |
| 3. Cards      | 🟡 Medium  | 🟢 High      | 🟡 Medium | Optional  | Balanced feel    |
| 4. Two-Screen | 🟢 Low     | 🟢 High      | 🟡 Medium | Optional  | **Your case**    |
| 5. Minimal    | 🟢 Low     | 🟡 Medium    | 🟢 Fast   | After     | Advanced users   |

---

## My Recommendation: **Option 4 (Two-Screen)**

**Why?**

- ✅ Friendly and not overwhelming (like Option 1, but faster)
- ✅ Clean visual separation (routine info → exercises)
- ✅ Exercises are _optional_ during creation (add later if needed)
- ✅ Matches your "baby steps" approach
- ✅ Easy to cancel at any point
- ✅ Fits with your existing UI (AppCard, ExpandedPanel aesthetic)

---

## Questions for Refinement

1. **Do you want exercises _during_ creation, or _after_?**
   - During (Options 3, 4): User adds exercises while creating
   - After (Options 1, 2, 5): Routine created first, then user can edit/add exercises

2. **How many optional fields?**
   - Required: Routine name
   - Optional: Duration, tags, exercises

3. **Should "tags" be multi-select or single?**
   - Multi-select (current) = user picks multiple tags
   - Single (simpler) = pick one tag

4. **After creating, should modal close auto or let user add more?**
   - Auto-close: Routine created, modal disappears, list refreshes
   - Stay open: Let user option to create another routine

---

## Next Steps

Pick your favorite option (or mix ideas!), and I'll:

1. Create the `CreateRoutineModal` component
2. Add the "Add Routine" button to the routines tab
3. Wire up the form submission to DB
4. Make it live! 🚀

**Which option speaks to you?**
