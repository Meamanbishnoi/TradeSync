# TradeSync

A personal trading journal built for active traders who want to track performance without the noise. Log trades, review your psychology, spot patterns, and export reports — all in one place.

---

## What it does

Most trading journals are either too simple (a spreadsheet) or too bloated (a SaaS with 40 features you'll never use). TradeSync sits in the middle — it gives you the tools that actually matter for improving as a trader, with a clean interface that stays out of your way.

**Trade logging**
- Log every trade with instrument, direction, entry/exit prices, contract size, session, setup, and notes
- PNL is auto-calculated from entry/exit/contracts for known futures instruments (ES, NQ, MES, MNQ, GC, CL, and more)
- Attach screenshots directly from your clipboard, drag-and-drop, or file picker
- Rate each trade 1–5 stars and tag the setup

**Analytics**
- Equity curve with proper Y-axis scaling, grid lines, and a hover tooltip showing cumulative and per-trade PNL
- Win rate, average R:R, profit factor, gross profit/loss, best trade
- Breakdown by session and by setup — see which ones are actually working
- Day-of-week performance with a bar chart and best/worst day callout
- Streak tracking (current streak, longest win/loss streak) — day-wise, not trade-wise
- Monthly summary table with win rate progress bars

**Calendar heatmap**
- Full month-by-month calendar showing daily PNL intensity
- Color scales from red to green relative to your best/worst day that month
- Hover any day to see trade count and exact PNL

**Daily journal**
- Rich text editor with formatting toolbar (bold, italic, headings, lists, blockquotes)
- View mode shows your entry cleanly rendered — editor only appears when you're actually writing
- Navigate by day with arrow buttons or jump to any date

**Reports**
- Generate a PDF report for today, a specific week, a custom date range, or your last N trades
- Includes a trade table, KPI summary, and win/loss breakdown

**Other**
- Dark and light mode with a manual toggle (remembers your preference)
- Bulk delete trades with checkbox selection
- Duplicate a trade (useful for similar setups back to back)
- Export filtered trades to CSV
- Collapsible sidebar on desktop, bottom nav on mobile
- Custom instruments and sessions per user profile

---

## Stack

- **Next.js 16** (App Router)
- **PostgreSQL** via Prisma ORM
- **NextAuth v4** — credentials + JWT
- **jsPDF + jspdf-autotable** for PDF generation
- **date-fns** for all date handling
- No UI library — everything is hand-rolled with inline styles and CSS variables

---

## Running locally

**Prerequisites:** Node.js 18+, a PostgreSQL database (local or hosted)

```bash
git clone https://github.com/Meamanbishnoi/TradeSync.git
cd TradeSync
npm install
```

Copy the example env file and fill in your values:

```bash
cp .env.example .env
```

```env
DATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="any-random-string"
NEXTAUTH_URL="http://localhost:3000"
```

Run the database migration and start the dev server:

```bash
npx prisma migrate dev
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), create an account, and start logging.

---

## Deploying

The easiest path is Vercel + Neon (serverless Postgres).

1. Push the repo to GitHub
2. Import it in Vercel
3. Create a Neon database and copy the connection string
4. Add `DATABASE_URL`, `NEXTAUTH_SECRET`, and `NEXTAUTH_URL` to Vercel environment variables
5. Deploy — Prisma migrations run automatically on first request if you add `prisma migrate deploy` to your build command

```json
"build": "prisma migrate deploy && next build"
```

---

## Project structure

```
src/
  app/
    api/          — API routes (trades, journal, reports, auth, profile)
    analytics/    — Analytics page
    heatmap/      — Calendar heatmap page
    journal/      — Daily journal
    reports/      — PDF report generator
    trade/        — New trade, trade detail, edit trade
  components/
    AnalyticsModal.tsx
    CalendarHeatmap.tsx
    EquityCurve.tsx
    StatsPanel.tsx
    TradesTable.tsx
    Toast.tsx
    ThemeProvider.tsx
    Sidebar.tsx / MobileNav.tsx
  lib/
    auth.ts       — NextAuth config
    prisma.ts     — Prisma client singleton
    constants.ts  — Shared instrument multipliers, default sessions
```

---

## License

MIT
