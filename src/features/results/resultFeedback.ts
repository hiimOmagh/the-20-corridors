export type LocalFeedbackRating = 1 | 2 | 3 | 4 | 5;
export type LocalFeedbackStatus = 'idle' | 'draft' | 'submitted' | 'missing-rating';

export interface LocalFeedbackOption {
  readonly rating: LocalFeedbackRating;
  readonly label: string;
  readonly description: string;
}

export interface LocalFeedbackFocusOption {
  readonly id: string;
  readonly label: string;
  readonly description: string;
}

export interface LocalFeedbackState {
  readonly rating: LocalFeedbackRating | null;
  readonly focusArea: string | null;
  readonly status: LocalFeedbackStatus;
}

export interface LocalFeedbackStatusCopy {
  readonly eyebrow: string;
  readonly title: string;
  readonly description: string;
}

export const LOCAL_FEEDBACK_RATINGS: readonly LocalFeedbackOption[] = [
  {
    rating: 1,
    label: '1',
    description: 'Felt generic'
  },
  {
    rating: 2,
    label: '2',
    description: 'Weak fit'
  },
  {
    rating: 3,
    label: '3',
    description: 'Mixed fit'
  },
  {
    rating: 4,
    label: '4',
    description: 'Mostly specific'
  },
  {
    rating: 5,
    label: '5',
    description: 'Strongly specific'
  }
] as const;

export const LOCAL_FEEDBACK_FOCUS_OPTIONS: readonly LocalFeedbackFocusOption[] = [
  {
    id: 'overview',
    label: 'Overview',
    description: 'Archetype, headline pattern, and dominant traits.'
  },
  {
    id: 'axes',
    label: 'Axes',
    description: 'The six-axis interpretation cards.'
  },
  {
    id: 'contradictions',
    label: 'Tensions',
    description: 'The contradiction map and behavioral implications.'
  },
  {
    id: 'evidence',
    label: 'Evidence',
    description: 'Question references and traceability.'
  },
  {
    id: 'share-card',
    label: 'Share card',
    description: 'The local share-card preview and copy text.'
  }
] as const;

export function createInitialLocalFeedbackState(): LocalFeedbackState {
  return {
    rating: null,
    focusArea: null,
    status: 'idle'
  };
}

export function selectLocalFeedbackRating(
  state: LocalFeedbackState,
  rating: LocalFeedbackRating
): LocalFeedbackState {
  return {
    ...state,
    rating,
    status: 'draft'
  };
}

export function selectLocalFeedbackFocus(
  state: LocalFeedbackState,
  focusArea: string
): LocalFeedbackState {
  const knownFocusArea = LOCAL_FEEDBACK_FOCUS_OPTIONS.some((option) => option.id === focusArea);

  if (!knownFocusArea) {
    return state;
  }

  return {
    ...state,
    focusArea,
    status: state.rating ? 'draft' : state.status
  };
}

export function submitLocalFeedback(state: LocalFeedbackState): LocalFeedbackState {
  if (!state.rating) {
    return {
      ...state,
      status: 'missing-rating'
    };
  }

  return {
    ...state,
    status: 'submitted'
  };
}

export function resetLocalFeedback(): LocalFeedbackState {
  return createInitialLocalFeedbackState();
}

export function getLocalFeedbackStatusCopy(state: LocalFeedbackState): LocalFeedbackStatusCopy {
  if (state.status === 'submitted') {
    return {
      eyebrow: 'Local feedback captured',
      title: `Rating ${state.rating}/5 selected locally`,
      description:
        'This feedback is held only in component state for the current page session. It is not persisted, transmitted, analyzed, or stored.'
    };
  }

  if (state.status === 'missing-rating') {
    return {
      eyebrow: 'Rating required',
      title: 'Choose a score before marking feedback locally.',
      description:
        'Phase 2.7 intentionally keeps feedback as a local UX stub. Select a rating to preview the future feedback flow.'
    };
  }

  if (state.status === 'draft') {
    return {
      eyebrow: 'Local draft',
      title: `Current local rating: ${state.rating}/5`,
      description:
        'The selection is only visible on this page. It will disappear on reload and does not touch storage, analytics, or a backend.'
    };
  }

  return {
    eyebrow: 'Local-only stub',
    title: 'Rate how specific this report felt.',
    description:
      'This prepares the future feedback experience without persistence, telemetry, analytics, backend calls, or user accounts.'
  };
}
