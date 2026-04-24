# STEA Firestore Data Models
## Student Center — Dynamic Collections

---

## 1. `student_updates` — Student Updates Page
**Primary collection for Student Updates. Admin-controlled, no tech content.**

```
student_updates/{docId}
  title:       string   // "HESLB Maombi 2026/2027 Yamefunguliwa"
  category:    string   // "heslb" | "tcu" | "admission" | "deadline" | "notice" | "announcement"
  source:      string   // "HESLB" | "TCU" | "UDSM" | "Admin"
  publishDate: timestamp // When to show this update
  deadline:    string   // Optional: "15 Agosti 2026"
  excerpt:     string   // Short summary (1-2 sentences)
  body:        string   // Full text (optional, for expanded view)
  status:      string   // "active" | "draft" | "inactive"
  priority:    string   // "high" | "normal" | "low"
  urgent:      boolean  // true = appears highlighted in gold
  link:        string   // External URL e.g. "https://www.heslb.go.tz"
  createdAt:   timestamp
```

**Filter chips map to `category` field:**
- All → no filter
- HESLB Updates → category == "heslb"
- TCU Updates → category == "tcu"
- Admission → category == "admission"
- Deadlines → category == "deadline"
- Notices → category == "notice"

**To add an update (Firebase Console):**
1. Go to Firestore → `student_updates` collection
2. Add document with fields above
3. Set `status: "active"` and `publishDate` to now
4. Set `urgent: true` if it should be highlighted

---

## 2. `quiz_daily` — Daily Quiz (Practice & Quizzes)
**One active document per day. Identified by `date` field.**

```
quiz_daily/{docId}
  date:      string   // "2026-04-20" (ISO date, today's quiz)
  active:    boolean  // true = this is today's quiz
  title:     string   // "Biology — Form 4 (CSEE)"
  emoji:     string   // "🧬"
  color:     string   // "#10b981"
  subject:   string   // "Biology"
  level:     string   // "Form 4" | "Form 6" | "Standard 7"
  duration:  string   // "8 min"
  questions: number   // 5
  xpValue:   number   // 50  (points awarded for completion)
  qs:        array    // Quiz questions array (see structure below)
  createdAt: timestamp
```

**Question structure (inside `qs` array):**
```
{
  q:    string   // "Seli ya damu nyekundu ina jina gani?"
  opts: string[] // ["Leukocyte","Erythrocyte","Platelet","Lymphocyte"]
  ans:  number   // 1  (0-indexed correct answer)
}
```

**Logic:** App looks for `date == today` OR `active == true`. Falls back to local quiz rotation if empty.

---

## 3. `quiz_weekly` — Weekly Challenge (Practice & Quizzes)
**One active document per week. Higher XP value.**

```
quiz_weekly/{docId}
  weekStart:   string   // "2026-04-20" (Monday of the week)
  weekEnd:     string   // "2026-04-26"
  active:      boolean  // true = this week's challenge
  title:       string   // "History — Form 6 (ACSEE)"
  emoji:       string   // "🏛️"
  color:       string   // "#f59e0b"
  subject:     string   // "History"
  level:       string   // "Form 6"
  duration:    string   // "15 min"
  questions:   number   // 10
  xpValue:     number   // 200  (higher than daily)
  leaderboardBonus: boolean // true = score goes to leaderboard
  qs:          array    // Same structure as quiz_daily.qs
  createdAt:   timestamp
```

---

## 4. `quiz_leaderboard` — Leaderboard (Practice & Quizzes)
**One document per user. Updated when user completes quizzes.**

```
quiz_leaderboard/{userId}
  userId:      string   // Firebase Auth UID
  displayName: string   // "Amina J."
  name:        string   // Alias for displayName
  score:       number   // Total cumulative points
  quizCount:   number   // Total quizzes completed
  weeklyScore: number   // Points earned this week (reset weekly)
  streakDays:  number   // Current daily streak
  lastActivity: timestamp
  updatedAt:   timestamp
```

**To write a score (from quiz completion):**
```javascript
// After quiz finishes, update/create leaderboard doc:
import { doc, setDoc, increment } from "firebase/firestore";
const db = getFirebaseDb();
await setDoc(doc(db, "quiz_leaderboard", user.uid), {
  userId: user.uid,
  displayName: user.displayName || "Mwanafunzi",
  score: increment(earnedPoints),
  quizCount: increment(1),
  weeklyScore: increment(earnedPoints),
  lastActivity: serverTimestamp(),
  updatedAt: serverTimestamp(),
}, { merge: true });
```

---

## 5. `updates` (Legacy) — Also read by StudentUpdatesPage
**Existing collection. StudentUpdatesPage reads this but filters out tech content.**

**Allowed categories (pass-through):**
`heslb`, `tcu`, `admission`, `deadline`, `notice`, `announcement`, `scholarship`, `exam`, `results`, `university`, `student`, `update`, `general`

**Blocked categories (stripped client-side):**
`tech`, `technology`, `gadget`, `apple`, `samsung`, `android`, `instagram`, `whatsapp`, `facebook`, `ai`, `tips`, `website`, `vpn`, `phone`, `laptop`, `app`

**Recommendation:** Migrate new student updates to `student_updates` collection (above) and use `updates` only for legacy/migrated content.

---

## Collection Summary

| Collection | Purpose | Read By |
|---|---|---|
| `student_updates` | Student news/announcements | StudentUpdatesPage (primary) |
| `updates` | Legacy updates (filtered) | StudentUpdatesPage (fallback) |
| `quiz_daily` | Today's featured quiz | PracticePage |
| `quiz_weekly` | This week's challenge | PracticePage |
| `quiz_leaderboard` | Student rankings | PracticePage |

---

## Admin Workflow

**To publish a student update:**
1. Firebase Console → Firestore → `student_updates` → Add Document
2. Set `status: "active"`, `category: "heslb"` (or other), `urgent: true` if needed
3. Visible immediately — no redeploy needed

**To set today's daily quiz:**
1. Firebase Console → Firestore → `quiz_daily` → Add Document  
2. Set `date: "2026-04-20"` (today), `active: true`
3. Add `qs` array with question objects
4. App shows it immediately

**To update the leaderboard:**
- Scores are written automatically when users complete quizzes (requires quiz completion handler)
- Or manually update `score` field in `quiz_leaderboard/{userId}` for testing
