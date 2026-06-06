import { describe, expect, it } from 'vitest';
import { runCorridorsEngine } from '@/core';
import {
  buildLocalPublicPreviewMetadata,
  buildLocalPublicResultPreview,
  buildPreviewTraitLine,
  getPublicLinkPreviewStateCopy,
  isPublicLinkPreviewPayloadSafe,
  LOCAL_PUBLIC_LINK_PREVIEW_ROUTE
} from '@/features/public-link/publicLinkPreview';

const sampleResult = runCorridorsEngine('1D 2B 3B 4A 5D 6B 7B 8D 9C 10B 11A 12D 13C 14A 15A 16D 17A 18B 19D 20D');

describe('local public-link preview helpers', () => {
  it('builds a minimized public-link preview model from a local public result', () => {
    const preview = buildLocalPublicResultPreview(
      sampleResult,
      buildLocalPublicPreviewMetadata(new Date('2026-06-06T00:00:00.000Z'))
    );

    expect(preview.route).toBe(LOCAL_PUBLIC_LINK_PREVIEW_ROUTE);
    expect(preview.mode).toBe('local-session-dto-preview-only');
    expect(preview.dto.axisSummaries).toHaveLength(6);
    expect(preview.dto.resultId).toBe('local_preview_result_0001');
    expect(preview.headline.expiryLabel).toContain('2026-06-20');
    expect(isPublicLinkPreviewPayloadSafe(preview.dto)).toBe(true);
  });

  it('excludes private full-result fields from the preview DTO surface', () => {
    const preview = buildLocalPublicResultPreview(
      sampleResult,
      buildLocalPublicPreviewMetadata(new Date('2026-06-06T00:00:00.000Z'))
    );
    const serialized = JSON.stringify(preview.dto);

    expect(serialized).not.toContain('answerText');
    expect(serialized).not.toContain('questionId');
    expect(serialized).not.toContain('evidenceDigest');
    expect(serialized).not.toContain('tagScores');
    expect(serialized).not.toContain('axisScoresRaw');
  });

  it('provides stable empty and invalid state copy', () => {
    expect(getPublicLinkPreviewStateCopy('empty').description).toContain('does not fetch');
    expect(getPublicLinkPreviewStateCopy('invalid', 'bad envelope').description).toBe('bad envelope');
    expect(getPublicLinkPreviewStateCopy('loading').title).toContain('Loading');
  });

  it('builds a readable trait line without exposing answer details', () => {
    const preview = buildLocalPublicResultPreview(
      sampleResult,
      buildLocalPublicPreviewMetadata(new Date('2026-06-06T00:00:00.000Z'))
    );

    expect(buildPreviewTraitLine(preview.dto)).toContain('(');
    expect(buildPreviewTraitLine({ dominantTags: [] })).toBe('No dominant trait signal');
  });
});
