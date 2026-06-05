import { describe, expect, it } from 'vitest';
import {
  LOCAL_FEEDBACK_FOCUS_OPTIONS,
  LOCAL_FEEDBACK_RATINGS,
  createInitialLocalFeedbackState,
  getLocalFeedbackStatusCopy,
  resetLocalFeedback,
  selectLocalFeedbackFocus,
  selectLocalFeedbackRating,
  submitLocalFeedback
} from '@/features/results/resultFeedback';

describe('local result feedback UX stub', () => {
  it('defines a bounded five-point local rating scale', () => {
    expect(LOCAL_FEEDBACK_RATINGS.map((option) => option.rating)).toEqual([1, 2, 3, 4, 5]);
    expect(LOCAL_FEEDBACK_RATINGS.every((option) => option.description.length > 0)).toBe(true);
  });

  it('defines local focus options without persistence or analytics semantics', () => {
    expect(LOCAL_FEEDBACK_FOCUS_OPTIONS.length).toBe(5);
    expect(LOCAL_FEEDBACK_FOCUS_OPTIONS.map((option) => option.id)).toEqual([
      'overview',
      'axes',
      'contradictions',
      'evidence',
      'share-card'
    ]);
  });

  it('captures rating and focus in local state only', () => {
    const initial = createInitialLocalFeedbackState();
    const rated = selectLocalFeedbackRating(initial, 4);
    const focused = selectLocalFeedbackFocus(rated, 'contradictions');

    expect(initial).toEqual({ rating: null, focusArea: null, status: 'idle' });
    expect(rated).toEqual({ rating: 4, focusArea: null, status: 'draft' });
    expect(focused).toEqual({ rating: 4, focusArea: 'contradictions', status: 'draft' });
  });

  it('ignores unknown focus areas instead of expanding the feedback contract', () => {
    const initial = createInitialLocalFeedbackState();

    expect(selectLocalFeedbackFocus(initial, 'database')).toEqual(initial);
  });

  it('requires a rating before local submit', () => {
    const missing = submitLocalFeedback(createInitialLocalFeedbackState());
    const submitted = submitLocalFeedback(selectLocalFeedbackRating(createInitialLocalFeedbackState(), 5));

    expect(missing.status).toBe('missing-rating');
    expect(submitted.status).toBe('submitted');
  });

  it('builds non-persistent status copy for every feedback state', () => {
    const idleCopy = getLocalFeedbackStatusCopy(createInitialLocalFeedbackState());
    const draftCopy = getLocalFeedbackStatusCopy(selectLocalFeedbackRating(createInitialLocalFeedbackState(), 3));
    const submittedCopy = getLocalFeedbackStatusCopy(submitLocalFeedback(selectLocalFeedbackRating(createInitialLocalFeedbackState(), 5)));

    expect(idleCopy.title).toContain('Rate');
    expect(draftCopy.description).toContain('does not touch storage');
    expect(submittedCopy.description).toContain('not persisted');
    expect(`${idleCopy.description} ${draftCopy.description} ${submittedCopy.description}`).not.toMatch(/analytics event sent|database write completed|backend saved/i);
  });

  it('resets back to the initial local feedback state', () => {
    expect(resetLocalFeedback()).toEqual(createInitialLocalFeedbackState());
  });
});
