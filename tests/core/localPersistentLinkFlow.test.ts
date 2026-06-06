import { describe, expect, it } from 'vitest';
import { runCorridorsEngine } from '../../src/core/engine';
import { createInMemoryPublicResultStorageAdapter } from '../../src/core/public-link/inMemoryPublicResultStorage';
import {
  LOCAL_PERSISTENT_LINK_FLOW_PHASE,
  LOCAL_PERSISTENT_LINK_PREVIEW_ROUTE,
  buildLocalPersistentLinkFlowSummary,
  createLocalPersistentLinkFlowResult,
  runLocalPersistentLinkFlowLifecycle
} from '../../src/core/public-link/localPersistentLinkFlow';

const sampleResult = runCorridorsEngine('1D 2B 3B 4A 5D 6B 7B 8D 9C 10B 11A 12D 13C 14A 15A 16D 17A 18B 19D 20D');
const publicId = 'pub_6Lk8qP2zR5xT9vN3mB7cY4hA';
const deleteToken = 'tok_6Lk8qP2zR5xT9vN3mB7cY4hA_secret';
const wrongDeleteToken = 'tok_wrongDeleteTokenForPhase62_localOnly';
const createdAt = '2026-06-06T12:00:00.000Z';

describe('local persistent-link flow helper', () => {
  it('creates a minimized DTO-only storage record through the adapter', async () => {
    const adapter = createInMemoryPublicResultStorageAdapter({ nowIso: () => createdAt });
    const result = await createLocalPersistentLinkFlowResult(adapter, {
      sourceResult: sampleResult,
      publicId,
      deleteToken,
      createdAt
    });

    expect(result.phase).toBe(LOCAL_PERSISTENT_LINK_FLOW_PHASE);
    expect(result.previewRoute).toBe(LOCAL_PERSISTENT_LINK_PREVIEW_ROUTE);
    expect(result.record.status).toBe('active');
    expect(result.record.publicId).toBe(publicId);
    expect(result.record.dto.resultId).toBe(publicId);
    expect(result.record.dto).not.toHaveProperty('answers');
    expect(result.record.dto).not.toHaveProperty('tagScores');
    expect(JSON.stringify(result.record)).not.toContain('answerText');
    expect(result.lifecycleNote).toContain('no API route');
  });

  it('runs create/read/wrong-delete/delete/prune lifecycle locally', async () => {
    const adapter = createInMemoryPublicResultStorageAdapter({ nowIso: () => createdAt });
    const lifecycle = await runLocalPersistentLinkFlowLifecycle(
      adapter,
      {
        sourceResult: sampleResult,
        publicId,
        deleteToken,
        createdAt
      },
      wrongDeleteToken,
      '2026-08-01T12:00:00.000Z'
    );

    expect(lifecycle.readAfterCreate.status).toBe('active');
    expect(lifecycle.wrongDeleteAttempt.status).toBe('active');
    expect(lifecycle.deleteResult.status).toBe('deleted');
    expect(lifecycle.readAfterDelete.status).toBe('deleted');
    expect(lifecycle.pruneResult.deletedCount).toBe(1);
    expect(lifecycle.rawAnswerLeakageCount).toBe(0);
    expect(lifecycle.fullResultLeakageCount).toBe(0);
  });

  it('summarizes the lifecycle without exposing private result internals', async () => {
    const adapter = createInMemoryPublicResultStorageAdapter({ nowIso: () => createdAt });
    const lifecycle = await runLocalPersistentLinkFlowLifecycle(
      adapter,
      {
        sourceResult: sampleResult,
        publicId,
        deleteToken,
        createdAt
      },
      wrongDeleteToken,
      '2026-08-01T12:00:00.000Z'
    );

    const summary = buildLocalPersistentLinkFlowSummary(lifecycle);

    expect(summary).toContain('previewRoute:/r/preview');
    expect(summary).toContain('wrongDelete:active');
    expect(summary).toContain('delete:deleted');
    expect(summary).toContain('rawLeaks:0');
    expect(summary.join('\n')).not.toContain('tagScores');
  });
});
