# Live Crawl Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove demo-only data paths and alert delivery, then let the dashboard trigger a live crawl manually and render real Firestore results.

**Architecture:** Keep Firestore as the single source of truth for competitors, sources, and signals. The frontend will call the deployed `triggerCrawl` HTTP function through a small client helper, while the existing realtime listeners continue updating the dashboard when signals are stored.

**Tech Stack:** React 19, TypeScript, Vite, Firebase Web SDK, Firebase Functions v2, Firestore, Node test runner with `tsx`

---

### Task 1: Add manual crawl client helper

**Files:**
- Create: `tests/manual-crawl.test.ts`
- Create: `src/lib/manual-crawl.ts`

- [ ] **Step 1: Write the failing test**
- [ ] **Step 2: Run `npm test` to verify the new helper contract fails before implementation**
- [ ] **Step 3: Implement manual crawl URL resolution and fetch wrapper in `src/lib/manual-crawl.ts`**
- [ ] **Step 4: Run `npm test` to verify the helper tests pass**

### Task 2: Wire dashboard action state

**Files:**
- Modify: `src/pages/dashboard.tsx`

- [ ] **Step 1: Add dashboard action state for running, success, and error feedback**
- [ ] **Step 2: Render a `Run Crawl` button near the stats header**
- [ ] **Step 3: Call the manual crawl helper from the button and surface response state**
- [ ] **Step 4: Run `npm run typecheck` to verify the dashboard stays type-safe**

### Task 3: Remove digest exports and browser-hostile crawl behavior

**Files:**
- Modify: `functions/src/scheduled/crawl.ts`
- Modify: `functions/src/index.ts`

- [ ] **Step 1: Add simple CORS handling and method checks to `triggerCrawl`**
- [ ] **Step 2: Stop exporting digest functions from `functions/src/index.ts`**
- [ ] **Step 3: Run `cd functions && npm run build` to verify the functions bundle still compiles**

### Task 4: Remove demo signal seeding and update docs

**Files:**
- Modify: `scripts/seed.ts`
- Modify: `README.md`

- [ ] **Step 1: Strip sample signal writes from `scripts/seed.ts`, leaving competitor/source bootstrap only**
- [ ] **Step 2: Update README to describe live crawl setup instead of demo sample data**
- [ ] **Step 3: Run `npm run build` and `npm test` to verify the repo still passes after cleanup**

### Task 5: Apply the live Firebase state

**Files:**
- Runtime only

- [ ] **Step 1: Run `npx tsx scripts/seed.ts` to seed competitors and sources**
- [ ] **Step 2: Deploy functions with `npx -y firebase-tools@latest deploy --only functions --force` so removed digest exports are reflected remotely**
- [ ] **Step 3: Verify the deployed function list and keep `triggerCrawl` as the only manual action endpoint**
