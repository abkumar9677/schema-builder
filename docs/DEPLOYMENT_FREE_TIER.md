# Free Deployment Strategy

## Recommended Zero-Cost Path

Use this for testing the app from different machines without paying:

1. Push this repository to GitHub.
2. Create a free PostgreSQL database on Neon or Supabase.
3. Deploy the API to Render Free Web Service.
4. Deploy the frontend to Render Static Site or Vercel Hobby.
5. Add all `.env` values as provider secrets.
6. Run Prisma migrations against the hosted database.

## Why Not AWS By Default

The original deployment guide proposes AWS ECS/EKS, RDS, ALB, CloudFront, Secrets Manager, CloudWatch, and Redis. Those services can generate charges and are not safe as a zero-cost default. Keep AWS as a future production option only.

## Verified Free-Tier References

- Google Gemini Developer API pricing says selected Gemini 2.5 Flash input/output tokens are free of charge on the Free tier, with limits: https://ai.google.dev/gemini-api/docs/pricing
- Gemini rate limits are tier-based and exceeding RPM/TPM/RPD returns rate-limit errors: https://ai.google.dev/gemini-api/docs/rate-limits
- Render documents free web services, free static sites, and free Postgres with limitations such as idle spin-down and monthly hours: https://render.com/free
- Neon pricing lists a Free plan with no credit card required and 0.5 GB storage per project: https://neon.com/pricing
- Supabase pricing lists a Free plan with 500 MB database size and paused projects after inactivity: https://supabase.com/pricing
- Vercel Hobby docs describe the Hobby plan as free for personal projects: https://vercel.com/docs/accounts/plans/hobby

## Required Environment Variables

- `DATABASE_URL`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `GEMINI_API_KEY_ENCRYPTION_KEY`
- `GEMINI_MODEL`
- `GEMINI_API_BASE`
- `CORS_ORIGIN`
- `VITE_API_URL`

## Quota Exhaustion Behavior

When Gemini returns HTTP 429, the API responds with:

```json
{
  "code": "AI_QUOTA_EXHAUSTED",
  "message": "Gemini free-tier token or request quota is exhausted. Try again after the quota resets."
}
```

The frontend header displays a visible quota-exhausted banner.
