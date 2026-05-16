# AI Schema Builder

AI Schema Builder is a full-stack scaffold for designing database tables, generating schemas with Google Gemini, detecting referenced tables, reviewing foreign keys, visualizing ERDs, and exporting SQL/JSON for backend services.

The supplied project documents mentioned Claude in some slides, but the SRS/TDD and zero-cost requirement point to Google Gemini. This scaffold uses Gemini as the default because Gemini Developer API has a free tier for supported models. API keys are never hardcoded; store credentials in `.env` for local work and platform secrets for deployment.

## Stack

- Web: React, TypeScript, Vite, Tailwind, React Flow
- API: Node.js, Express, TypeScript, Zod, JWT, bcrypt, AES-256-GCM
- Database: PostgreSQL through Prisma
- Tests: Vitest, React Testing Library, Supertest
- CI/CD: GitHub Actions
- Free deployment path: Vercel or Render for app hosting, Neon or Supabase free Postgres for database

## Quick Start

```bash
npm install
cp .env.example .env
npm run prisma:generate
npm run prisma:migrate
npm run dev
```

Open the web app at `http://localhost:5173` and the API health check at `http://localhost:8080/health`.

## Important Free-Tier Notes

- Do not use the AWS ECS/EKS/RDS plan from the original deployment document unless you accept paid infrastructure.
- Use Gemini `gemini-2.5-flash` or another free-tier supported model.
- When Gemini returns 429/rate-limit responses, the API returns `AI_QUOTA_EXHAUSTED`; the frontend displays a top header banner saying the token/quota is exhausted.
- Keep billing disabled or spend caps enabled wherever a provider offers them.

## TDD Workflow

1. Write or update a failing test in `apps/api/tests` or `apps/web/src/**/*.test.tsx`.
2. Implement the smallest production change.
3. Run `npm test`.
4. Run `npm run lint` and `npm run typecheck`.

## Security

- Passwords use bcrypt with 12 salt rounds.
- Protected routes require `Authorization: Bearer <jwt>`.
- Gemini keys are encrypted with AES-256-GCM before persistence.
- Inputs are validated with Zod.
- HTTP hardening uses Helmet, CORS allow-listing, and API rate limiting.
