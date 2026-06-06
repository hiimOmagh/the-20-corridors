import { describe, expect, it } from 'vitest';
import { runCorridorsEngine } from '../../src/core';
import {
  buildLocalLifecycleDeleteTokenHash,
  buildLocalLifecyclePublicId,
  createInitialPublicLinkLifecycleState,
  createPublicLinkLifecycleStub,
  deletePublicLinkLifecycleStub,
  getPublicLinkLifecycleStatusLabel
} from '../../src/features/results/publicLinkLifecycleUi';

const result = runCorridorsEngine('1D 2B 3B 4A 5D 6B 7B 8D 9C 10B 11A 12D 13C 14A 15A 16D 17A 18B 19D 20D');
const createdAt = '2026-06-06T12:00:00.000Z';

describe('public link lifecycle UI helpers', () => {
  it('starts in a local-only idle state', () => {
    const state = createInitialPublicLinkLifecycleState();

    expect(state.status).toBe('idle');
    expect(state.publicId).toBeNull();
    expect(state.previewHref).toBe('/r/preview');
    expect(state.boundaryItems.join(' ')).toContain('No backend API route');
    expect(state.boundaryItems.join(' ')).toContain('database');
  });

  it('creates a minimized DTO lifecycle stub without raw choices or private score internals', () => {
    const state = createPublicLinkLifecycleStub(result, createdAt);
    const serialized = JSON.stringify(state.dto);

    expect(state.status).toBe('created');
    expect(state.publicId).toMatch(/^pub_/);
    expect(state.deleteToken).toMatch(/^tok_/);
    expect(state.deleteTokenHash).toMatch(/^sha256_/);
    expect(state.dto?.resultId).toBe(state.publicId);
    expect(serialized).not.toContain('answers');
    expect(serialized).not.toContain('tagScores');
    expect(serialized).not.toContain('evidenceDigest');
  });

  it('rejects a wrong delete token and deletes with the generated local token', () => {
    const created = createPublicLinkLifecycleStub(result, createdAt);
    const rejected = deletePublicLinkLifecycleStub(created, 'wrong-local-delete-token');
    const deleted = deletePublicLinkLifecycleStub(created, created.deleteToken);

    expect(rejected.status).toBe('delete-rejected');
    expect(rejected.dto?.resultId).toBe(created.dto?.resultId);
    expect(deleted.status).toBe('deleted');
    expect(deleted.lifecycleSteps.map((step) => `${step.label}:${step.status}`)).toContain('Delete-token check:complete');
  });

  it('builds stable local identifiers and status labels', () => {
    expect(buildLocalLifecyclePublicId(result, createdAt)).toBe('pub_observer_strategist_20260606120000');
    expect(buildLocalLifecycleDeleteTokenHash('tok_safe_local_delete_token_123456789')).toMatch(/^sha256_/);
    expect(getPublicLinkLifecycleStatusLabel('created')).toBe('Local stub active');
    expect(getPublicLinkLifecycleStatusLabel('deleted')).toBe('Deleted locally');
  });
});
