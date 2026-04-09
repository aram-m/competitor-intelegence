# Competitor Intelligence

Realtime competitor-signal dashboard backed by Firebase Firestore and Firebase Functions.

## Local setup

### Web app

1. Install dependencies:

```bash
npm install
```

2. Create a local env file from the example:

```bash
cp .env.example .env.local
```

3. Start the app:

```bash
npm run dev
```

4. Use the dashboard `Run Crawl` button to trigger a live crawl and watch Firestore-backed results stream into the UI.

### Functions

1. Install the functions dependencies:

```bash
cd functions
npm install
cp .env.example .env
```

2. Fill in the required values:

- `GEMINI_API_KEY` for server-side Gemini classification
- `GITHUB_TOKEN` if you want authenticated GitHub crawling

3. Optional: enable alerts

Alerts are disabled by default. To turn them on, update `functions/.env`:

```bash
ENABLE_ALERTS=true
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
SLACK_BOT_TOKEN=
SLACK_CHANNEL_ID=
```

Important:
- Telegram alerts require both `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID`
- Slack alerts require both `SLACK_BOT_TOKEN` and `SLACK_CHANNEL_ID`
- If `ENABLE_ALERTS=true` but no valid Telegram or Slack keys are present, no alerts will be sent
- You can configure Telegram only, Slack only, or both at the same time

4. Build functions:

```bash
npm run build
```

## Seed crawl sources

Populate Firestore with competitors and source definitions for live crawling:

```bash
npx tsx scripts/seed.ts
```

## Verification

```bash
npm test
npm run typecheck
npm run build
cd functions && npm run build
```
