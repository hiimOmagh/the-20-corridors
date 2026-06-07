# Phase 8.18 — Public Result Lookup Page Activation Contract

Status: contract-only activation decision.

This phase defines the production-safe activation decision for the future `/r/[publicId]` database-backed public result lookup page.

The activation contract may reach `public-result-lookup-page-activation-ready-not-applied`, but it does not implement or apply the actual public page route binding.

## Guarantees

- Phase 8.17 public lookup dry-run remains required.
- API route database binding gate remains required.
- Rollback/failure evidence remains required.
- `PUBLIC_RESULT_PUBLIC_LOOKUP_DATABASE_ACTIVATION=enabled` is required.
- Complete database environment is required.
- API route rollback mode blocks public lookup activation.
- Actual `/r/[publicId]` database lookup remains not applied.
- No real public page database read is executed.
- No network lookup smoke is executed.
- No persistent public lookup route is introduced.

## Next

Phase 8.19 may implement the public lookup page behind the activation decision, while preserving rollback and failure-mode behavior.
