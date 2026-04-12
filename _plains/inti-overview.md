# 🏋️ Lyte-Log: Gym Exercise Logger

A lightweight mobile app for tracking gym workouts, exercises, and performance metrics.

---

## 📋 Project Overview

**Purpose**: Simple, fast tracker for gym sessions - log exercises, build workouts, and monitor progress.

**Target Users**: Gym enthusiasts who want minimal-friction workout logging.

**Tech Stack**:

- React Native + Expo Router (cross-platform: iOS, Android, Web)
- TypeScript (type safety)
- SQLite + Drizzle ORM (local database)
- NativeWind + Tailwind (styling)
- React Native Reanimated (smooth animations)

---

## 🎯 Core Features

### Tab 1: **Workouts** 📝

Display list of all logged workout sessions.

**Features**:

- View all workouts (date, exercises count, duration)
- Filter by date range
- Quick stats (total reps, total weight)
- Tap to view workout details
- Edit/delete existing workouts
- Search functionality

**Data to display**:

```
- Workout date & time
- Duration
- Number of exercises
- Total volume (kg)
- Notes
```

---

### Tab 2: **Exercises & Workout Builder** 🏗️

Create and manage exercise routines.

**Features**:

- Browse exercise library (pre-built + custom exercises)
- Create new custom exercises
- Build new workout templates
- Add exercises to active workout
- Edit sets/reps/weight during session
- Real-time tracking while exercising
- Rest timer between sets

**Workflow**:

1. Start new workout
2. Select exercises from library
3. Define sets/reps/weight for each exercise
4. Log actual performance during session
5. Save when done

---

### Tab 3: **Performance** 📊

Analytics and progress tracking.

**Features**:

- Personal records (PRs) per exercise
- Progress charts (weight over time, volume trends)
- Weekly/monthly statistics
- Most used exercises
- Workout frequency heatmap
- Body measurements tracker (future)

**Metrics**:

- Max weight lifted (per exercise)
- Total volume per week
- Workout consistency
- Average reps per set

---

### Tab 4: **Settings** ⚙️ (Future)

App configuration and preferences.

**Features** (planned):

- User profile (name, weight, height)
- Units preference (kg/lbs)
- Theme (light/dark/auto)
- Data export/backup
- Exercise library management
- Notifications/reminders

---

## 🗄️ Database Schema (Drizzle)

Schema documentation was moved to a dedicated file:

- `_plains/database-schema.md`

---

## 🎨 UI/UX Structure

### Navigation Flow

```
Home (Workouts Tab)
  ├── Workouts List
  ├── Workout Detail
  └── Edit Workout

Exercises Tab
  ├── Exercise Library
  ├── Create Exercise
  ├── Workout Builder
  └── Active Workout (during session)

Performance Tab
  ├── Stats Dashboard
  ├── Exercise Detail (PR history)
  └── Charts

Settings Tab (future)
  ├── Profile
  ├── Preferences
  └── Data Management
```

---

## 🚀 MVP (Phase 1)

### Must Have:

- ✅ Log workout with date/time
- ✅ Add exercises to workout
- ✅ Record sets/reps/weight
- ✅ View all workouts list
- ✅ View workout details
- ✅ Edit/delete workouts
- ✅ Basic statistics (total volume, PR)

### Nice to Have:

- ⏱️ Rest timer between sets
- 📊 Performance charts
- 🔍 Exercise search
- 📱 Responsive design (web/mobile)

---

## 🔄 Phase 2 (Future)

- Settings tab with user preferences
- Body measurements tracker
- Workout templates/programs
- Social features (share PRs)
- Push notifications/reminders
- Data backup to cloud

---

## 📂 Project Folder Structure

```
app/
├── (tabs)/
│   ├── _layout.tsx                 # Tab navigator
│   ├── workouts.tsx                # Workout list & detail
│   ├── exercises.tsx               # Exercise library & builder
│   ├── performance.tsx             # Stats & analytics
│   └── settings.tsx                # App settings (future)
├── workout/
│   ├── [id]/detail.tsx             # Workout detail modal
│   ├── [id]/edit.tsx               # Edit workout
│   └── create.tsx                  # New workout modal
└── _layout.tsx                     # Root layout

components/
├── WorkoutList.tsx
├── ExerciseCard.tsx
├── StatsChart.tsx
├── RestTimer.tsx
└── SetInput.tsx                    # Reps/weight input

db/
├── schema.ts                       # Drizzle schema
├── migrations/                     # Database migrations
└── seed.ts                         # Exercise library seed

hooks/
├── useWorkouts.ts                  # CRUD workouts
├── useExercises.ts                 # Exercise management
├── useStats.ts                     # Performance calculations
└── useLocalDatabase.ts             # SQLite connection

constants/
├── exercises.ts                    # Default exercises library
└── muscleGroups.ts                 # Exercise categories
```

---

## 💾 Development Checklist

- [ ] Setup Drizzle + SQLite with seed data
- [ ] Create exercise library (default exercises)
- [ ] Build Tab navigator layout
- [ ] Implement Workouts tab
- [ ] Implement Exercises tab with builder
- [ ] Implement Performance tab with charts
- [ ] Add edit/delete functionality
- [ ] Add search and filters
- [ ] Polish UI/UX
- [ ] Test on iOS, Android, Web
- [ ] Performance optimization

---

## 🎬 Getting Started

```bash
# Install dependencies
npm install

# Seed database with exercise library
npm run db:seed

# Start development
npm run ios          # iOS simulator
npm run android      # Android emulator
npm run web          # Web preview
```

---

**Status**: Planning Phase ✍️  
**Last Updated**: April 2026
