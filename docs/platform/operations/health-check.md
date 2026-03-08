# Health Check

## Endpoint

`GET /api/health`

## Behavior

- Executes `SELECT 1` through Prisma.
- On success returns HTTP `200` with:
  - `status: "ok"`
  - `database: "connected"`
  - `timestamp`
- On failure returns HTTP `500` with:
  - `status: "error"`
  - `database: "disconnected"`
  - `error`

## Usage

Use this endpoint after environment setup and after DB configuration changes to validate connectivity.
