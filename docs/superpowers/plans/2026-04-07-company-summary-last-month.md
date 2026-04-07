# Company Summary Last-Month Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the noisy per-signal dashboard with recent company summaries limited to the last 30 days.

**Architecture:** Keep Firestore subscriptions as-is, move the time window to a rolling 30-day helper, compute deterministic company summaries on the frontend, and render a summary-first expandable company list with a compact evidence section.

**Tech Stack:** React, TypeScript, Firebase Firestore, Vite, Node test runner

---

### Task 1: Rolling 30-Day Filter

**Files:**
- Modify: `src/lib/signal-filters.ts`
- Modify: `src/hooks/use-filters.ts`
- Test: `tests/signal-filters.test.ts`

- [ ] **Step 1: Write the failing test**
- [ ] **Step 2: Run test to verify it fails**
- [ ] **Step 3: Implement a rolling 30-day cutoff helper**
- [ ] **Step 4: Run test to verify it passes**

### Task 2: Company Summary Aggregation

**Files:**
- Modify: `src/lib/signal-groups.ts`
- Create: `src/lib/company-summaries.ts`
- Test: `tests/signal-groups.test.ts`
- Test: `tests/company-summaries.test.ts`

- [ ] **Step 1: Write the failing summary tests**
- [ ] **Step 2: Run test to verify they fail**
- [ ] **Step 3: Implement deterministic summary aggregation**
- [ ] **Step 4: Run test to verify they pass**

### Task 3: Summary-First UI

**Files:**
- Modify: `src/components/signals/signal-list.tsx`
- Modify: `src/pages/dashboard.tsx`
- Modify: `src/components/signals/signal-card.tsx`

- [ ] **Step 1: Update company cards to show summary metadata**
- [ ] **Step 2: Reduce expanded evidence rows to a compact supporting list**
- [ ] **Step 3: Update top-level dashboard copy to reflect the 30-day window**
- [ ] **Step 4: Verify the UI compiles cleanly**

### Task 4: Verification

**Files:**
- No code changes required unless regressions appear

- [ ] **Step 1: Run `npm test`**
- [ ] **Step 2: Run `npm run typecheck`**
- [ ] **Step 3: Run `npm run build`**
