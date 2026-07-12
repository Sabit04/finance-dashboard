# Personal Finance Dashboard

Import a bank CSV and get transactions auto-categorized, spend trends by category/month, and budget alerts.

Stack: Next.js (App Router, TypeScript) · Tailwind CSS · `papaparse` · `recharts` · Anthropic (Claude) API

## Features

- CSV import — matches common bank export header variants (`Date`/`Description`/`Amount` or `Debit`/`Credit`)
- AI categorization via Claude tool calling, so the model returns a fixed category per transaction instead of free text
- Spend-by-category and spend-by-month charts
- Budget thresholds per category with over-budget alerts
- Editable categories — correcting a category feeds a live categorization accuracy stat
- Alert relevance rating, tracked as its own metric

## Design notes

- Categorization happens server-side (`src/app/api/categorize/route.ts`) so the Anthropic API key never reaches the browser.
- Requests are capped at 500 transactions to bound cost and latency per call.
- Accuracy and alert-relevance aren't vanity numbers — they're computed from real user corrections/ratings, not hardcoded.

## Local development

```bash
npm install
cp .env.local.example .env.local   # add your Anthropic API key
npm run dev
```

Get a key at [console.anthropic.com](https://console.anthropic.com). `.env.local` is git-ignored, so the key is never committed.

Open [http://localhost:3000](http://localhost:3000) and drag in a CSV.

## Deployment

Deployed on Vercel. `ANTHROPIC_API_KEY` is set as a Vercel project environment variable, not in the repo.
