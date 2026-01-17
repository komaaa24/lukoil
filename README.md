# Lukoil Telegram Bot (Node.js + TypeScript + grammY)

Telegram bot for engine-oil reminders with deep-link QR tokens, phone capture, admin broadcast tools, and monthly scheduling backed by Postgres + Redis + BullMQ.

## Stack
- Node.js 20+, TypeScript
- grammY bot framework
- PostgreSQL + TypeORM (entities + migrations)
- BullMQ + Redis for reminders/broadcast jobs
- pino logging, zod validation, jest tests

## Quick Start (local)
```bash
cp .env.example .env          # fill BOT_TOKEN, ADMIN_API_KEY, etc.
docker-compose up -d          # start Postgres + Redis
npm install
npm run migration:run         # apply DB schema
npm run dev                   # start bot (long polling, dev mode)
# in separate terminals for background workers:
npm run dev:worker            # sends reminders/broadcasts
npm run dev:scheduler         # enqueues due reminders/broadcasts
```

Build/start production bundle:
```bash
npm run build
npm run start                 # bot
npm run start:worker
npm run start:scheduler
```

## Environment
- `BOT_TOKEN` – Telegram bot token (from @BotFather)
- `DATABASE_URL` – Postgres connection (or use DB_HOST/DB_PORT/DB_USERNAME/DB_PASSWORD/DB_NAME)
- `REDIS_URL` – Redis connection for sessions + queues
- `ADMIN_API_KEY` – protects `/stats` HTTP endpoint
- `SEED_SUPER_ADMIN_TELEGRAM_ID` – optional auto-seed admin (telegram user id)
- `WEBHOOK_URL` + `WEBHOOK_SECRET_TOKEN` – optional; if unset, long polling is used

## Database & Migrations
- DataSource: `src/db/data-source.ts`
- Entities: `src/db/entities/*`
- Run migrations: `npm run migration:run`
- Generate migration: `npm run migration:generate -- <name>`

## Deep-link / Token Rules
- Barcode/QR encodes: `https://t.me/<bot_username>?start=<TOKEN>`
- Token validation: `P####-XXXXX` pattern (uppercased). Stored in `product_tokens`.
- Every scan creates `scan_events` and, after phone is saved, a single active `subscription` per (user, token).
- Quick generator: `npm run generate:link -- --bot=<bot_username> --token=P2026-ABCDE` prints ready deep-link.

## Bot Commands & Flow
- `/start <token>`: records scan, requests phone with Telegram contact button, creates subscription (reminder day = scan day clamped to 28, next run = +1 month at 10:00 Asia/Tashkent).
- Contact button required (manual phone accepted as fallback).
- `/help`, `/status`, `/stop` (deactivates all reminders).
- Monthly reminder text: `⛽️ Avtomobilingiz moyini almashtirishni esdan chiqarmang!`

## Admin UX (bot)
- `/admin` (admins only; seeded via `SEED_SUPER_ADMIN_TELEGRAM_ID` or DB)
- Inline menu: broadcast create, stats, user lookup, stop scheduled broadcasts.
- Broadcast flow: enter message → pick target (all / with phone / active subs) → send now or schedule.
- Rate limited ~20-25 msg/sec with logging in `broadcast_logs`.

## Optional HTTP API
- `GET /health` – always 200
- `GET /stats` – requires `x-api-key: ADMIN_API_KEY`

## Tests & Lint
```bash
npm test
npm run lint
```

## Qo‘shimcha funksiyalar
- Inline onboarding: til, avtomobil brendi, moy turi, rejim (oylik / km).
- Dashboard inline tugmalari va /profile.
- Reminder action tugmalari (HMAC imzoli): Almashtirdim / Snooze / To‘xtatish.
- Referral: /invite → ref link, ball va promo kodlar.
- Shikoyat yuborish (token shubhali bo‘lsa) va ko‘rish (admin).
- Servis lokatori: /service joylashuv yuborish.
- Admin panel segmentlari: oxirgi 30 kun, oil type bo‘yicha, shikoyatlar ro‘yxati.

## Deep-link examples
- Token `P2026-ABCDE` → `https://t.me/<bot_username>?start=P2026-ABCDE`

## Notes
- Long polling by default; webhook supported if `WEBHOOK_URL` is set.
- Sessions stored in Redis; queues use Redis; Postgres holds users/subscriptions/scans.
- Graceful shutdown handles bot, DB, workers. Phones are stored as plain strings (ready for future encryption wrapper).
