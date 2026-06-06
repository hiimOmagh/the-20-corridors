# Phase 8.4 Status — Database SDK Selection Decision Record

Phase 8.4 is a decision-record phase.

## User-visible status

The app remains unchanged for users. Public-result API routes still run in dry-run/in-memory behavior. No persistent public lookup route exists.

## Engineering status

- selected SDK: @neondatabase/serverless
- SDK is documented but not installed
- SDK is documented but not imported
- rejected alternatives are documented
- serverless runtime assumptions are documented
- secret-handling model is documented
- failure model is documented
- factory still cannot create a database adapter
- routes still use memory/dry-run behavior

## Explicitly not included

- no database package installation
- no database SDK import
- no database client creation
- no database adapter implementation
- no migration files
- no auth
- no payment
- no AI
- no analytics
- no telemetry
- no persistent `/r/[publicId]` route

## Validation

Run:

```bash
npm run contract:database-sdk-decision
npm run validate
```

Evidence is written to:

```text
docs/evidence/database-sdk-selection-decision-record-latest.json
```
