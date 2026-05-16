# Source Document Summary

This scaffold preserves the intent of the supplied SRS, TDD, deployment guide, roadmap, and presentation.

## Product Requirement

AI Schema Builder helps backend engineers define projects, add database tables, generate detailed table schemas, detect referenced tables and foreign keys, review relationships, visualize ERDs, and export SQL/JSON documentation.

## Core Scope

- Email/password auth with JWT-protected APIs.
- Project CRUD and table management.
- Gemini-powered schema generation using project context and table descriptions.
- Editable schema review before saving.
- Version snapshots on regeneration.
- Foreign-key reference suggestions with accept/reject review.
- ERD visualization using React Flow.
- SQL DDL and JSON export.
- Encrypted per-user Gemini API key storage.

## Implementation Choices

- The source files mix "Claude/Anthropic" and "Google Gemini." Because the cost requirement is zero and the SRS/TDD call out Gemini free tier, the scaffold implements Gemini first.
- AWS ECS/EKS/RDS from the deployment document is treated as a paid production option, not the default path.
- Free-first deployment is documented with Render or Vercel for hosting and Neon or Supabase for PostgreSQL.
