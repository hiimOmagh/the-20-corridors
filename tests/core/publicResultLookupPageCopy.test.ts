import { describe, expect, it } from 'vitest';
import {
  buildPublicResultLookupPageCopy,
  PUBLIC_RESULT_LOOKUP_PAGE_COPY_PHASE,
  PUBLIC_RESULT_LOOKUP_PAGE_COPY_SCHEMA_VERSION,
  summarizePublicResultLookupPageCopyRules
} from '../../src/core/public-link/publicResultLookupPageCopy';
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

describe('public result lookup page copy', () => {
  it('builds polished user-facing copy for renderable public results without exposing private payloads', async () => {
    const adapter = createPublicResultLookupPageImplementationFixtureAdapter();
    const view = await resolvePublicResultLookupPageImplementationView({
      publicId: PUBLIC_RESULT_LOOKUP_PAGE_IMPLEMENTATION_ACTIVE_PUBLIC_ID,
      env,
      context: 'public-result-lookup-page-implementation-gate',
      adapter
    });
    const copy = buildPublicResultLookupPageCopy(view);

    expect(copy).toMatchObject({
      schemaVersion: PUBLIC_RESULT_LOOKUP_PAGE_COPY_SCHEMA_VERSION,
      phase: PUBLIC_RESULT_LOOKUP_PAGE_COPY_PHASE,
      tone: 'renderable',
      title: view.dto?.archetype.title,
      rawAnswersExposed: false,
      rawDeleteTokenExposed: false
    });
    expect(copy.explanation).toContain('limited public summary');
    expect(copy.explanation).toContain('not the private answer trail');
    expect(copy.recovery).toContain('conversation artifact');
    expect(JSON.stringify(copy)).not.toContain('questionAnswers');
    expect(JSON.stringify(copy)).not.toContain('deleteToken');
  });

  it('builds distinct readable copy for missing, deleted, expired, disabled, configuration, and storage states', async () => {
    const adapter = createPublicResultLookupPageImplementationFixtureAdapter();
    const missing = buildPublicResultLookupPageCopy(await resolvePublicResultLookupPageImplementationView({
      publicId: PUBLIC_RESULT_LOOKUP_PAGE_IMPLEMENTATION_MISSING_PUBLIC_ID,
      env,
      context: 'public-result-lookup-page-implementation-gate',
      adapter
    }));
    const deleted = buildPublicResultLookupPageCopy(await resolvePublicResultLookupPageImplementationView({
      publicId: PUBLIC_RESULT_LOOKUP_PAGE_IMPLEMENTATION_DELETED_PUBLIC_ID,
      env,
      context: 'public-result-lookup-page-implementation-gate',
      adapter
    }));
    const expired = buildPublicResultLookupPageCopy(await resolvePublicResultLookupPageImplementationView({
      publicId: PUBLIC_RESULT_LOOKUP_PAGE_IMPLEMENTATION_EXPIRED_PUBLIC_ID,
      env,
      context: 'public-result-lookup-page-implementation-gate',
      adapter
    }));
    const disabled = buildPublicResultLookupPageCopy(await resolvePublicResultLookupPageImplementationView({
      publicId: PUBLIC_RESULT_LOOKUP_PAGE_IMPLEMENTATION_ACTIVE_PUBLIC_ID,
      env: { ...env, PUBLIC_RESULT_API_ROUTE_DATABASE_BINDING_ROLLBACK: 'memory' },
      context: 'public-result-lookup-page-implementation-gate',
      adapter
    }));
    const configuration = buildPublicResultLookupPageCopy({
      status: 'public-result-page-configuration-error',
      httpStatus: 500,
      dto: null
    });
    const storage = buildPublicResultLookupPageCopy({
      status: 'public-result-page-storage-unavailable',
      httpStatus: 500,
      dto: null
    });

    expect(missing).toMatchObject({ tone: 'not-found', title: 'Public result not found' });
    expect(missing.summary).toContain('No public result matches this link');
    expect(deleted).toMatchObject({ tone: 'deleted', title: 'This public result was deleted' });
    expect(deleted.explanation).toContain('intentionally unavailable');
    expect(expired).toMatchObject({ tone: 'expired', title: 'This public result expired' });
    expect(expired.explanation).toContain('Expiry limits');
    expect(disabled).toMatchObject({ tone: 'disabled', title: 'Public result lookup is paused' });
    expect(disabled.explanation).toContain('Rollback mode prevents public lookup rendering');
    expect(configuration).toMatchObject({ tone: 'configuration-error', title: 'Public result lookup is not configured' });
    expect(configuration.explanation).toContain('No private answer data is exposed');
    expect(storage).toMatchObject({ tone: 'storage-unavailable', title: 'Public result temporarily unavailable' });
    expect(storage.explanation).toContain('does not confirm data loss');
  });

  it('summarizes copy-polish rules without changing persistence or smoke behavior', () => {
    expect(summarizePublicResultLookupPageCopyRules()).toEqual(
      expect.arrayContaining([
        `phase:${PUBLIC_RESULT_LOOKUP_PAGE_COPY_PHASE}`,
        `schema:${PUBLIC_RESULT_LOOKUP_PAGE_COPY_SCHEMA_VERSION}`,
        'copy-polish-only-no-persistence-change',
        'operational-smoke-remains-opt-in-only',
        'raw-answers-remain-blocked',
        'raw-delete-token-remains-blocked'
      ])
    );
  });
});
