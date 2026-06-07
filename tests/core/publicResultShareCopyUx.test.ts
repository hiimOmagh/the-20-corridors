import { describe, expect, it } from 'vitest';
import {
  buildPublicResultShareCopyUx,
  PUBLIC_RESULT_SHARE_COPY_UX_PHASE,
  PUBLIC_RESULT_SHARE_COPY_UX_SCHEMA_VERSION,
  summarizePublicResultShareCopyUxRules
} from '../../src/core/public-link/publicResultShareCopyUx';
import {
  createPublicResultLookupPageImplementationFixtureAdapter,
  PUBLIC_RESULT_LOOKUP_PAGE_IMPLEMENTATION_ACTIVE_PUBLIC_ID,
  PUBLIC_RESULT_LOOKUP_PAGE_IMPLEMENTATION_DELETED_PUBLIC_ID,
  PUBLIC_RESULT_LOOKUP_PAGE_IMPLEMENTATION_EXPIRED_PUBLIC_ID,
  PUBLIC_RESULT_LOOKUP_PAGE_IMPLEMENTATION_MISSING_PUBLIC_ID,
  resolvePublicResultLookupPageImplementationView
} from '../../src/core/public-link/publicResultLookupPageImplementation';
import { buildCompletePublicResultLookupPageDatabaseActivationEnvironment } from '../../src/core/public-link/publicResultLookupPageDatabaseActivation';

const env = buildCompletePublicResultLookupPageDatabaseActivationEnvironment();

describe('public result share/copy UX', () => {
  it('builds clear share and manual-copy guidance for renderable public result pages', async () => {
    const adapter = createPublicResultLookupPageImplementationFixtureAdapter();
    const view = await resolvePublicResultLookupPageImplementationView({
      publicId: PUBLIC_RESULT_LOOKUP_PAGE_IMPLEMENTATION_ACTIVE_PUBLIC_ID,
      env,
      context: 'public-result-lookup-page-implementation-gate',
      adapter
    });

    const shareCopy = buildPublicResultShareCopyUx({
      status: view.status,
      httpStatus: view.httpStatus,
      dto: view.dto,
      publicPath: `/r/${PUBLIC_RESULT_LOOKUP_PAGE_IMPLEMENTATION_ACTIVE_PUBLIC_ID}`
    });

    expect(shareCopy).toMatchObject({
      schemaVersion: PUBLIC_RESULT_SHARE_COPY_UX_SCHEMA_VERSION,
      phase: PUBLIC_RESULT_SHARE_COPY_UX_PHASE,
      availability: 'available',
      heading: 'Share this public result',
      primaryActionLabel: 'Copy public result link',
      manualCopyLabel: 'Manual copy path',
      manualCopyValue: `/r/${PUBLIC_RESULT_LOOKUP_PAGE_IMPLEMENTATION_ACTIVE_PUBLIC_ID}`,
      canOfferCopyAction: true,
      rawAnswersExposed: false,
      rawDeleteTokenExposed: false
    });
    expect(shareCopy.instruction).toContain('limited DTO-only result summary');
    expect(shareCopy.fallbackInstruction).toContain('manually copy this page path');
    expect(JSON.stringify(shareCopy)).not.toContain('questionAnswers');
    expect(JSON.stringify(shareCopy)).not.toContain('deleteToken');
  });

  it('blocks copy actions for missing, deleted, expired, and rollback-disabled states', async () => {
    const adapter = createPublicResultLookupPageImplementationFixtureAdapter();
    const states = await Promise.all([
      resolvePublicResultLookupPageImplementationView({
        publicId: PUBLIC_RESULT_LOOKUP_PAGE_IMPLEMENTATION_MISSING_PUBLIC_ID,
        env,
        context: 'public-result-lookup-page-implementation-gate',
        adapter
      }),
      resolvePublicResultLookupPageImplementationView({
        publicId: PUBLIC_RESULT_LOOKUP_PAGE_IMPLEMENTATION_DELETED_PUBLIC_ID,
        env,
        context: 'public-result-lookup-page-implementation-gate',
        adapter
      }),
      resolvePublicResultLookupPageImplementationView({
        publicId: PUBLIC_RESULT_LOOKUP_PAGE_IMPLEMENTATION_EXPIRED_PUBLIC_ID,
        env,
        context: 'public-result-lookup-page-implementation-gate',
        adapter
      }),
      resolvePublicResultLookupPageImplementationView({
        publicId: PUBLIC_RESULT_LOOKUP_PAGE_IMPLEMENTATION_ACTIVE_PUBLIC_ID,
        env: { ...env, PUBLIC_RESULT_API_ROUTE_DATABASE_BINDING_ROLLBACK: 'memory' },
        context: 'public-result-lookup-page-implementation-gate',
        adapter
      })
    ]);

    for (const state of states) {
      const shareCopy = buildPublicResultShareCopyUx({
        status: state.status,
        httpStatus: state.httpStatus,
        dto: state.dto,
        publicPath: '/r/not-shareable'
      });

      expect(shareCopy).toMatchObject({
        availability: 'unavailable',
        heading: 'Sharing unavailable for this state',
        primaryActionLabel: 'Copy action unavailable',
        manualCopyValue: null,
        canOfferCopyAction: false,
        rawAnswersExposed: false,
        rawDeleteTokenExposed: false
      });
      expect(shareCopy.instruction).toContain('no renderable public result to share');
      expect(shareCopy.unavailableReason).toBeTruthy();
    }
  });

  it('summarizes share/copy UX rules without changing persistence, binding, or smoke behavior', () => {
    expect(summarizePublicResultShareCopyUxRules()).toEqual(
      expect.arrayContaining([
        `phase:${PUBLIC_RESULT_SHARE_COPY_UX_PHASE}`,
        `schema:${PUBLIC_RESULT_SHARE_COPY_UX_SCHEMA_VERSION}`,
        'share-copy-ux-only-no-persistence-change',
        'unavailable-states-do-not-offer-copy-action',
        'database-binding-unchanged',
        'operational-smoke-unchanged'
      ])
    );
  });
});
