# Company Summary Last-Month Design

## Goal

Reduce feed noise by showing one concise summary per company, limited to changes from the last 30 days.

## Scope

- Replace the fixed `2026-01-01` cutoff with a rolling 30-day window.
- Keep existing source filters and company grouping.
- Show a summary-first company card instead of rendering every signal as a primary row.
- Keep a short expandable evidence list per company for traceability.
- Avoid adding any new AI calls for summary generation.

## Design

### Data window

The UI should only show signals whose `publishedAt` or `createdAt` falls within the last 30 days. This keeps the dashboard focused on recent competitor movement without requiring a schema migration.

### Company summaries

Each company group should compute:

- total recent signals
- latest activity date
- top priorities present
- source types represented
- a deterministic summary sentence derived from those recent signals

The summary should prefer high-signal facts:

- recent activity count
- source coverage (`Blog`, `GitHub`, `Hiring`)
- latest headline or strongest-priority item

### Presentation

Each company card should show:

- logo and company name
- summary sentence
- count of recent changes
- latest update timing
- badges for active source types and strongest priority

Expanding the card should reveal only a compact list of the most recent supporting signals rather than the full legacy feed.

## Testing

- add tests for the rolling 30-day cutoff
- add tests for company summary aggregation and ordering
- run the existing root test, typecheck, and build flows
