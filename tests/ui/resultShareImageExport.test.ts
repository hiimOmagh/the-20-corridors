import { describe, expect, it } from 'vitest';
import { runCorridorsEngine } from '@/core';
import { buildLocalShareCardPreview } from '@/features/results/resultShareCard';
import {
  LOCAL_SHARE_IMAGE_EXPORT_BOUNDARY_NOTE,
  LOCAL_SHARE_IMAGE_EXPORT_HEIGHT,
  LOCAL_SHARE_IMAGE_EXPORT_SCHEMA_VERSION,
  LOCAL_SHARE_IMAGE_EXPORT_WIDTH,
  buildLocalShareCardExportSvg,
  buildLocalShareImageExportPayload,
  buildLocalShareImageFileName,
  getLocalShareImageExportStatusCopy
} from '@/features/results/resultShareImageExport';

describe('local share-card image export helpers', () => {
  it('builds a safe versioned export payload from the local share-card preview', () => {
    const result = runCorridorsEngine('1D 2B 3B 4A 5D 6B 7B 8D 9C 10B 11A 12D 13C 14A 15A 16D 17A 18B 19D 20D');
    const card = buildLocalShareCardPreview(result);
    const payload = buildLocalShareImageExportPayload(card);

    expect(payload.schemaVersion).toBe(LOCAL_SHARE_IMAGE_EXPORT_SCHEMA_VERSION);
    expect(payload.fileName).toMatch(/^the-20-corridors-[a-z0-9-]+\.png$/);
    expect(payload.width).toBe(LOCAL_SHARE_IMAGE_EXPORT_WIDTH);
    expect(payload.height).toBe(LOCAL_SHARE_IMAGE_EXPORT_HEIGHT);
    expect(payload.title).toBe(card.title);
    expect(payload.pattern).toBe(card.pattern);
    expect(payload.signature).toBe(card.signature);
    expect(payload.boundaryNote).toBe(LOCAL_SHARE_IMAGE_EXPORT_BOUNDARY_NOTE);
  });

  it('builds deterministic PNG filenames from archetype titles', () => {
    expect(buildLocalShareImageFileName({ title: 'The Observer Strategist' })).toBe('the-20-corridors-the-observer-strategist.png');
    expect(buildLocalShareImageFileName({ title: '!!!' })).toBe('the-20-corridors-corridors-result.png');
  });

  it('renders an SVG card without raw answers or full serialized result data', () => {
    const result = runCorridorsEngine('1A 2A 3A 4D 5A 6A 7D 8B 9A 10A 11A 12A 13B 14C 15B 16A 17C 18A 19C 20B');
    const svg = buildLocalShareCardExportSvg(buildLocalShareCardPreview(result));

    expect(svg).toContain('<svg');
    expect(svg).toContain('The 20 Corridors');
    expect(svg).toContain('Corridor signature');
    expect(svg).toContain(LOCAL_SHARE_IMAGE_EXPORT_BOUNDARY_NOTE);
    expect(svg).not.toMatch(/result\.answers|selectedAnswer|questionId|serializeCorridorsResult/i);
  });

  it('escapes unsafe text for SVG output', () => {
    const card = buildLocalShareCardPreview(runCorridorsEngine('1D 2B 3B 4A 5D 6B 7B 8D 9C 10B 11A 12D 13C 14A 15A 16D 17A 18B 19D 20D'));
    const svg = buildLocalShareCardExportSvg({
      ...card,
      title: '<script>alert("x")</script>',
      pattern: 'A & B < C > D'
    });

    expect(svg).toContain('&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;');
    expect(svg).toContain('A &amp; B &lt; C &gt; D');
    expect(svg).not.toContain('<script>');
  });

  it('returns explicit local export status copy', () => {
    expect(getLocalShareImageExportStatusCopy('idle')).toContain('Local PNG export is ready');
    expect(getLocalShareImageExportStatusCopy('exporting')).toContain('Generating local PNG');
    expect(getLocalShareImageExportStatusCopy('exported')).toContain('completed');
    expect(getLocalShareImageExportStatusCopy('unsupported')).toContain('not supported');
    expect(getLocalShareImageExportStatusCopy('failed')).toContain('failed');
  });
});
