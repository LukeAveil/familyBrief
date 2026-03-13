# FamilyBrief 🗓️

> Your family's AI chief of staff

## What it does
- Parses forwarded school/activity emails into calendar events using Claude AI
- Displays a clean family calendar with colour-coded members
- Sends a personalised weekly briefing every Sunday morning

## Tech Stack
- **Frontend**: Next.js 14 + Tailwind CSS
- **Database**: Supabase (auth + postgres)
- **AI**: Claude (Anthropic) — email parsing + briefing generation
- **Email**: Resend — inbound parsing + outbound delivery
- **Payments**: Stripe — $5/month subscription

## Project Structure
```
src/
├── app/
│   ├── api/
│   │   ├── parse-email/     # Inbound email webhook → Claude parsing
│   │   ├── weekly-briefing/ # Cron job → generate + send Sunday briefings
│   │   ├── events/          # CRUD for calendar events
│   │   └── auth/            # Supabase auth handlers
│   ├── dashboard/           # Main calendar view
│   ├── onboarding/          # Family setup flow
│   └── auth/                # Login / signup pages
├── components/
│   ├── ui/                  # Buttons, inputs, modals
│   ├── calendar/            # Calendar grid + event cards
│   ├── briefing/            # Briefing preview component
│   └── layout/              # Nav, sidebar, shell
├── lib/
│   ├── anthropic.ts         # AI prompts (email parsing, briefing gen)
│   ├── supabase.ts          # DB client
│   ├── stripe.ts            # Payment helpers
│   └── email.ts             # Resend helpers
├── hooks/                   # useEvents, useFamilyMembers, etc.
└── types/                   # Shared TypeScript types
```

## Setup

1. Clone and install
```bash
npm install
```

2. Copy env file and fill in keys
```bash
cp .env.example .env.local
```

3. Set up Supabase — run `supabase-schema.sql` in your project's SQL editor

4. Set up Stripe — create a $5/month recurring product and copy the price ID

5. Set up Resend — configure inbound email routing to your `/api/parse-email` webhook

6. Run locally
```bash
npm run dev
```

## Deployment
Deploy to Vercel. Set up a cron job (Vercel Cron or GitHub Actions) to call `/api/weekly-briefing` every Sunday at 7am.
