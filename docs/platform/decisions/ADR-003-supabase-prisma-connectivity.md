# ADR-003: Supabase + Prisma Connectivity

## Status

Accepted

## Problem

Product OS requires a stable database connection path that works for:

- Prisma runtime queries in the app
- Prisma CLI commands (`prisma generate`, `db push`, seed workflow)
- Health validation via `GET /api/health`

Early local setup was sensitive to connection-string details and produced inconsistent results when configuration changed between runs.

## What Did Not Work Reliably

- Treating any Supabase URI variant as interchangeable without validation.
- Running setup with connection settings that omitted required SSL behavior.
- Switching connection variants without re-verifying `db:push`, `db:seed`, and `/api/health` as a single acceptance flow.

## Decision

Standardize on one verified `DATABASE_URL` value for both Prisma runtime and Prisma CLI flows, using Supabase Postgres format with `sslmode=require`.

- Prisma datasource: `url = env("DATABASE_URL")`
- Setup sequence: `npm run prisma:generate` -> `npm run db:push` -> `npm run db:seed`
- Runtime verification: `GET /api/health` performs `SELECT 1`

## What Eventually Worked

A single, Supabase-compatible `DATABASE_URL` with required SSL settings, validated end-to-end by:

1. Prisma client generation
2. Schema push
3. Seed completion
4. Health endpoint returning connected status

## Why This Configuration Was Chosen

- Removes drift between local runtime and CLI behavior.
- Makes connectivity troubleshooting deterministic.
- Uses an explicit, testable acceptance path instead of ad hoc checks.

## Practical Lessons

- Validate connection changes with the full setup + health sequence, not one command.
- Keep one canonical `DATABASE_URL` per environment for Prisma operations.
- Treat schema push, seed, and health check as the minimum connectivity contract before development work starts.
