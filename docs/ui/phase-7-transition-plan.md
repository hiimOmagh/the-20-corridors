# Phase 7 Transition Plan — Backend Readiness Without Implementation

## Purpose

Phase 7 should prepare the project for a real persistence boundary without implementing production storage prematurely.

## Recommended next milestone

**Phase 7.0 — Backend API Boundary Contract**

Scope:

- Define API request/response DTOs for creating, reading, and deleting public result links.
- Require PublicResultDto-only persistence.
- Define public ID and delete-token transport boundaries.
- Define expiry and deletion semantics.
- Define abuse-control expectations.
- Keep the implementation mocked or contract-only.

## Still blocked until explicitly opened

- Real database writes.
- Hosted backend deployment.
- Authentication.
- Payments.
- Analytics.
- AI-generated reports.
- Full-result or raw-answer persistence.

## Exit criteria for Phase 7 readiness

- API DTOs are minimized and test-covered.
- Delete-token semantics are explicit.
- Expiry behavior is deterministic.
- No private scoring internals cross the API boundary.
- Public lookup routes cannot expose raw answers.
