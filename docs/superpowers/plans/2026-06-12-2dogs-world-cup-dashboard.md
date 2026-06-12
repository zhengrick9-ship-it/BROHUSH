# 2DOGS World Cup Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a secure, persistent, round-based shared World Cup betting dashboard under the 2DOGS brand.

**Architecture:** Move betting calculations into a typed domain module, expose validated read/write API routes, and render one responsive client dashboard. Use a repeatable SQL migration to deduplicate shared bets and add round metadata while keeping Supabase as the source of truth.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, Tailwind CSS 4, Supabase, Node test runner.

---

### Task 1: Domain model and tests

**Files:**
- Create: `lib/wcw2026/types.ts`
- Create: `lib/wcw2026/metrics.ts`
- Create: `lib/wcw2026/metrics.test.ts`
- Modify: `package.json`

- [ ] Write failing tests for settlement, shared summary metrics, round grouping, and cumulative timeline.
- [ ] Run `npm test` and verify failures are caused by missing domain functions.
- [ ] Implement typed pure functions.
- [ ] Run `npm test` and verify all tests pass.

### Task 2: Database migration and API

**Files:**
- Create: `supabase/migrations/202606120001_2dogs_shared_betting.sql`
- Create: `lib/supabase/admin.ts`
- Create: `lib/auth/session.ts`
- Modify: `app/api/data/route.ts`
- Modify: `app/api/bets/route.ts`
- Create: `app/api/session/route.ts`
- Create: `app/api/matches/[id]/route.ts`

- [ ] Add schema migration with explicit grants, RLS, round fields, bet deduplication, constraints, and indexes.
- [ ] Add server-only Supabase admin client and signed session cookie helpers.
- [ ] Replace split-by-index reads with shared-bet reads and explicit error responses.
- [ ] Add validated match and bet mutation routes.
- [ ] Verify unauthorized writes return 401 and malformed payloads return 400.

### Task 3: 2DOGS dashboard

**Files:**
- Create: `app/components/DogMark.tsx`
- Create: `app/components/InvestmentChart.tsx`
- Modify: `app/page.tsx`
- Replace: `app/projects/wcw2026/page.tsx`
- Modify: `app/globals.css`

- [ ] Replace BRORUSH branding with 2DOGS and original Shiba/Cocker SVG marks.
- [ ] Build shared summary cards and three compact capital lines.
- [ ] Add horizontally scrollable round navigation.
- [ ] Render each match with model, shared bet, stake, result, and profit.
- [ ] Add authenticated inline editing with clear save/error feedback.

### Task 4: Cleanup and quality gates

**Files:**
- Delete: `app/projects/wcw2026/bets/page.tsx`
- Delete: `app/projects/wcw2026/pnl/page.tsx`
- Delete: `sync-bets.js`
- Delete: `add-person.sql`
- Delete: `import-bets.sql`
- Delete: `public-rls.sql`
- Modify: `.gitignore`
- Modify: `next.config.ts`
- Modify: `tsconfig.json`
- Modify: `lib/supabase/server.ts`

- [ ] Remove duplicate routes and credential-bearing scripts.
- [ ] Restore TypeScript build validation.
- [ ] Add ignores for local worktrees and betting ticket photos.
- [ ] Run tests, type checking, production build, dependency audit, and browser smoke tests.
