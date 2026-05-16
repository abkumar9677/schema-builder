# Manual Steps To Make The App Visible Online For Free

1. Create a GitHub repository and push this folder.
2. Create a Google AI Studio key at https://aistudio.google.com.
3. Create a free Neon or Supabase Postgres project.
4. Copy the hosted database connection string.
5. Create a Render account.
6. Create a Render Web Service for the API.
7. Set API build command: `npm install && npm run prisma:generate && npm run build --workspace apps/api`.
8. Set API start command: `npm run start --workspace apps/api`.
9. Add API environment variables from `.env.example`.
10. Create a Render Static Site or Vercel Hobby project for `apps/web`.
11. Set `VITE_API_URL` to the deployed API URL.
12. Set API `CORS_ORIGIN` to the deployed frontend URL.
13. Run migrations from your local machine against the hosted DB: `DATABASE_URL="<hosted-url>" npm run prisma:migrate`.
14. Register a user in the app.
15. Save your Gemini key in the app.
16. Create a project, add tables, generate schemas, and test from another machine using the frontend URL.

Cost-control checklist:

- Keep hosting plans on Free/Hobby only.
- Do not enable AWS, paid Render instances, or paid database add-ons.
- Keep Supabase spend cap enabled if you choose Supabase Pro later.
- Watch Gemini API 429 errors; the app banner will appear when the free-tier quota is exhausted.
