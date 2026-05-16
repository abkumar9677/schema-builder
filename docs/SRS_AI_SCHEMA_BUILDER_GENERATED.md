# Software Requirements Specification

## Purpose

AI Schema Builder is a web application for backend engineers who need fast, reviewable database table models and referenced-table relationships while building backend services.

## Functional Requirements

- Users can register and log in with email/password.
- Protected API routes require a JWT bearer token.
- Users can create projects with target RDBMS type: PostgreSQL, MySQL, or SQLite.
- Users can add tables with plain-English descriptions.
- Users can store a Gemini API key encrypted at rest.
- Users can request AI schema generation for a table.
- The system sends project context, existing tables, target RDBMS, and table purpose to Gemini.
- Generated columns, constraints, indexes, and references are editable before final use.
- Every regeneration creates a new schema version.
- The system can suggest referenced tables and foreign keys.
- Users can accept or reject FK suggestions.
- Users can export schemas as SQL DDL and JSON.
- The frontend displays a quota-exhausted banner when Gemini free-tier limits are hit.

## Non-Functional Requirements

- Password hashing uses bcrypt with 12 rounds.
- Gemini keys are encrypted with AES-256-GCM.
- Inputs are validated with Zod.
- API rate limiting is enabled.
- CI must run type checks, tests, and builds.
- The app must be deployable using free-tier hosting and database services.
