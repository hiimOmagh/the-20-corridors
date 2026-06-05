import { describe, expect, it } from 'vitest';
import { runCorridorsEngine } from '@/core';
import {
  buildEvidenceLookup,
  buildResultReportViewModel,
  formatEvidenceSummary,
  resolveEvidenceRefs
} from '@/features/results/resultReportViewModel';

const observerStrategistAnswers =
  '1D 2B 3B 4A 5D 6B 7B 8D 9C 10B 11A 12D 13C 14A 15A 16D 17A 18B 19D 20D';

describe('result report view model', () => {
  it('builds the complete full-report view model from the public result DTO', () => {
    const result = runCorridorsEngine(observerStrategistAnswers);
    const viewModel = buildResultReportViewModel(result);

    expect(viewModel.headlineMetrics).toHaveLength(4);
    expect(viewModel.dominantTraits.length).toBeGreaterThanOrEqual(3);
    expect(viewModel.axisCards).toHaveLength(6);
    expect(viewModel.strengths.length).toBeGreaterThan(0);
    expect(viewModel.failureModes.length).toBeGreaterThan(0);
    expect(viewModel.growthDirections.length).toBeGreaterThan(0);
    expect(viewModel.disprovenIf.length).toBeGreaterThan(0);
    expect(viewModel.evidence.all.length).toBeGreaterThan(0);
    expect(viewModel.shareSummary).toContain(result.archetype.title);
  });

  it('resolves every axis evidence reference against the evidence digest', () => {
    const result = runCorridorsEngine(observerStrategistAnswers);
    const viewModel = buildResultReportViewModel(result);

    for (const axisCard of viewModel.axisCards) {
      expect(axisCard.evidence.length).toBeGreaterThan(0);
      expect(axisCard.evidence.every((item) => item.ref.startsWith('Q'))).toBe(true);
      expect(axisCard.evidence.every((item) => item.answerText.length > 0)).toBe(true);
    }
  });

  it('keeps contradiction cards evidence-linked when contradictions exist', () => {
    const result = runCorridorsEngine(observerStrategistAnswers);
    const viewModel = buildResultReportViewModel(result);

    expect(viewModel.contradictionCards.length).toBeGreaterThan(0);

    for (const contradiction of viewModel.contradictionCards) {
      expect(contradiction.tension.length).toBeGreaterThan(0);
      expect(contradiction.behavioralImplication.length).toBeGreaterThan(0);
      expect(contradiction.disprovenIf.length).toBeGreaterThan(0);
      expect(contradiction.evidence.length).toBeGreaterThan(0);
    }
  });

  it('returns only known evidence references when resolving evidence refs', () => {
    const result = runCorridorsEngine(observerStrategistAnswers);
    const lookup = buildEvidenceLookup(result.report.evidenceDigest);
    const resolved = resolveEvidenceRefs(lookup, ['Q19D', 'Q404A']);

    expect(resolved).toHaveLength(1);
    expect(resolved[0]?.ref).toBe('Q19D');
  });

  it('formats evidence summaries with answer text for accessible card titles', () => {
    const result = runCorridorsEngine(observerStrategistAnswers);
    const lookup = buildEvidenceLookup(result.report.evidenceDigest);
    const summary = formatEvidenceSummary(resolveEvidenceRefs(lookup, ['Q19D', 'Q20D']));

    expect(summary).toContain('Q19D');
    expect(summary).toContain('Q20D');
    expect(summary).toContain(':');
  });
});
