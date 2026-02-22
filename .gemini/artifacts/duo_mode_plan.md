# Duo Mode – Implementation Plan

## Concept
Two users pair up to co-parent a shared plant. Both contribute (water, meals, goals, steps).
The smoker's cigarettes hurt the shared plant. The non-smoker gets visibility into the smoker's
stats and receives alerts (smoke logged, hotspot entered). Shared accountability + fear of
disappointing each other drives healthy behavior.

## Phase 1: Backend – Duo Model & APIs

### 1a. Duo Model (`models/Duo.js`)
- `userA` (ObjectId → User) – the one who sends the invite
- `userB` (ObjectId → User) – the one who accepts
- `inviteCode` (String, unique 6-char) – used to pair
- `status` (enum: pending, active, ended)
- `sharedPlant` – object with combined score fields:
  - `waterA`, `waterB`, `mealsA`, `mealsB`, `goalsA`, `goalsB`
  - `smokesA`, `smokesB`, `stepsA`, `stepsB`
  - `lastResetDate` (daily reset)
- `createdAt`, `updatedAt`

### 1b. User Model Update
- Add `duoId` (ObjectId → Duo, nullable) to User schema
- Add `duoInviteCode` (String, nullable)

### 1c. Duo Controller & Routes (`controllers/duoController.js`, `routes/duoRoutes.js`)
- `POST /api/duo/create` – generate invite code, create Duo(pending)
- `POST /api/duo/join` – accept code, activate Duo
- `GET /api/duo/status` – get Duo data + partner info
- `POST /api/duo/update-stats` – push daily stats (water, meals, goals, smokes, steps)
- `POST /api/duo/log-smoke` – log smoke + notify partner
- `POST /api/duo/leave` – end the Duo
- `GET /api/duo/partner-stats` – get partner's daily stats

### 1d. Push Notifications for Duo Events
- When smoker logs a cigarette → push to partner: "🚬 [Name] just smoked. Send support!"
- When smoker enters hotspot (future) → push to partner
- Daily summary push to both: plant health, combined stats

## Phase 2: Frontend – Duo Setup & Shared Plant

### 2a. Duo Setup Screen (`app/duo/index.tsx`)
- "Create Duo" → generates & shows invite code
- "Join Duo" → enter partner's code
- Shows partner info once paired

### 2b. Shared Plant on Home Screen
- When user has an active Duo, the plant uses COMBINED stats
- Both users' water + meals + goals contribute positively
- Smoker's smokes hurt the shared plant
- HUD shows "🤝 Duo Mode" badge

### 2c. Partner Stats Panel
- Below the console: card showing partner's today stats
- Water count, meals, goals done, smokes (if applicable)
- "Send Encouragement" button → push notification to partner

### 2d. Profile/Settings – Duo Management
- View duo status, partner name
- Leave duo option

## Phase 3: Future (Not in this sprint)
- Hotspot geofencing with notifications
- Shared streak counter
- Duo leaderboard / achievements
- Chat between duo partners
