import type { CorridorsPublicResultDto, PublicResultDto } from '@/core';
import { buildPublicResultDto } from '@/core';

export const PUBLIC_LINK_LIFECYCLE_UI_PHASE = 'phase-6.3-public-link-lifecycle-ui-stub' as const;
export const PUBLIC_LINK_LIFECYCLE_PREVIEW_ROUTE = '/r/preview' as const;
export const PUBLIC_LINK_LIFECYCLE_STORAGE_MODE = 'in-memory-flow-stub-ui-only' as const;

export type PublicLinkLifecycleUiStatus = 'idle' | 'created' | 'delete-rejected' | 'deleted';

export interface PublicLinkLifecycleUiState {
  readonly phase: typeof PUBLIC_LINK_LIFECYCLE_UI_PHASE;
  readonly status: PublicLinkLifecycleUiStatus;
  readonly title: string;
  readonly description: string;
  readonly actionLabel: string;
  readonly secondaryActionLabel: string;
  readonly tone: 'neutral' | 'ready' | 'warning' | 'deleted';
  readonly publicId: string | null;
  readonly previewHref: typeof PUBLIC_LINK_LIFECYCLE_PREVIEW_ROUTE;
  readonly deleteToken: string | null;
  readonly deleteTokenHash: string | null;
  readonly dto: PublicResultDto | null;
  readonly copyText: string;
  readonly boundaryItems: readonly string[];
  readonly lifecycleSteps: readonly PublicLinkLifecycleStep[];
}

export interface PublicLinkLifecycleStep {
  readonly label: string;
  readonly status: 'pending' | 'complete' | 'blocked';
  readonly detail: string;
}

export function createInitialPublicLinkLifecycleState(): PublicLinkLifecycleUiState {
  return buildState({
    status: 'idle',
    title: 'No local public-link stub has been created.',
    description: 'Generate a local-only preview record to simulate the future create/read/delete lifecycle without a backend.',
    actionLabel: 'Create local link stub',
    secondaryActionLabel: 'Nothing to delete',
    tone: 'neutral',
    publicId: null,
    deleteToken: null,
    deleteTokenHash: null,
    dto: null
  });
}

export function createPublicLinkLifecycleStub(
  result: CorridorsPublicResultDto,
  createdAt = new Date().toISOString()
): PublicLinkLifecycleUiState {
  const publicId = buildLocalLifecyclePublicId(result, createdAt);
  const deleteToken = buildLocalLifecycleDeleteToken(publicId, createdAt);
  const deleteTokenHash = buildLocalLifecycleDeleteTokenHash(deleteToken);
  const expiresAt = buildLocalLifecycleExpiry(createdAt);
  const dto = buildPublicResultDto(result, {
    resultId: publicId,
    createdAt,
    expiresAt,
    deleteTokenHash
  });

  return buildState({
    status: 'created',
    title: 'Local public-link stub created.',
    description: 'The simulated link exists only in this component state and mirrors the Phase 6 in-memory flow boundary.',
    actionLabel: 'Open local preview',
    secondaryActionLabel: 'Delete local stub',
    tone: 'ready',
    publicId,
    deleteToken,
    deleteTokenHash,
    dto
  });
}

export function deletePublicLinkLifecycleStub(
  state: PublicLinkLifecycleUiState,
  suppliedDeleteToken: string | null = state.deleteToken
): PublicLinkLifecycleUiState {
  if (state.status !== 'created' || state.publicId === null || state.deleteToken === null || state.dto === null) {
    return buildState({
      status: 'idle',
      title: 'No active local stub to delete.',
      description: 'Create a local-only public-link stub before testing the delete-token lifecycle.',
      actionLabel: 'Create local link stub',
      secondaryActionLabel: 'Nothing to delete',
      tone: 'neutral',
      publicId: null,
      deleteToken: null,
      deleteTokenHash: null,
      dto: null
    });
  }

  if (suppliedDeleteToken !== state.deleteToken) {
    return buildState({
      ...state,
      status: 'delete-rejected',
      title: 'Delete-token check rejected.',
      description: 'The simulated delete request did not match the local delete token. The preview record remains active.',
      actionLabel: 'Open local preview',
      secondaryActionLabel: 'Retry delete',
      tone: 'warning'
    });
  }

  return buildState({
    ...state,
    status: 'deleted',
    title: 'Local public-link stub deleted.',
    description: 'The simulated record is marked deleted in local component state. No remote deletion, account, or database was involved.',
    actionLabel: 'Create another local stub',
    secondaryActionLabel: 'Deleted locally',
    tone: 'deleted'
  });
}

export function buildPublicLinkLifecycleCopyText(state: PublicLinkLifecycleUiState): string {
  const idLine = state.publicId ? `Preview id: ${state.publicId}` : 'Preview id: not created';
  const statusLine = `Lifecycle state: ${state.status}`;
  const routeLine = `Preview route: ${state.previewHref}`;
  const boundaryLine = 'Boundary: local component state + minimized DTO only; no backend, API route, database, public lookup, auth, payment, analytics, or AI.';

  return ['The 20 Corridors — local public-link lifecycle stub', idLine, statusLine, routeLine, boundaryLine].join('\n');
}

export function getPublicLinkLifecycleStatusLabel(status: PublicLinkLifecycleUiStatus): string {
  switch (status) {
    case 'idle':
      return 'Not created';
    case 'created':
      return 'Local stub active';
    case 'delete-rejected':
      return 'Delete rejected';
    case 'deleted':
      return 'Deleted locally';
  }
}

export function buildLocalLifecyclePublicId(result: CorridorsPublicResultDto, createdAt: string): string {
  const safeArchetype = result.archetype.id.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 24);
  const stamp = createdAt.replace(/\D/g, '').slice(0, 14).padEnd(14, '0');
  return `pub_${safeArchetype}_${stamp}`.slice(0, 80);
}

export function buildLocalLifecycleDeleteToken(publicId: string, createdAt: string): string {
  const stamp = createdAt.replace(/\D/g, '').slice(0, 14).padEnd(14, '0');
  return `tok_${publicId}_${stamp}_local_delete_only`.slice(0, 96);
}

export function buildLocalLifecycleDeleteTokenHash(deleteToken: string): string {
  const compact = deleteToken.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 72).padEnd(32, 'x');
  return `sha256_${compact}`.slice(0, 120);
}

export function buildLocalLifecycleExpiry(createdAt: string): string {
  const base = new Date(createdAt);
  if (Number.isNaN(base.getTime())) {
    throw new Error('Local public-link lifecycle expiry requires an ISO-like creation date.');
  }
  return new Date(base.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
}

function buildState(input: Omit<PublicLinkLifecycleUiState, 'phase' | 'previewHref' | 'copyText' | 'boundaryItems' | 'lifecycleSteps'>): PublicLinkLifecycleUiState {
  const stateBase = {
    ...input,
    phase: PUBLIC_LINK_LIFECYCLE_UI_PHASE,
    previewHref: PUBLIC_LINK_LIFECYCLE_PREVIEW_ROUTE,
    boundaryItems: buildBoundaryItems(input.status),
    lifecycleSteps: buildLifecycleSteps(input.status)
  };

  return {
    ...stateBase,
    copyText: buildPublicLinkLifecycleCopyText({ ...stateBase, copyText: '' })
  };
}

function buildBoundaryItems(status: PublicLinkLifecycleUiStatus): readonly string[] {
  const activeState = status === 'created' || status === 'delete-rejected';
  return [
    activeState ? 'A minimized PublicResultDto is prepared for the preview surface.' : 'No active public DTO is exposed from this local UI state.',
    'Raw choices and private score internals remain excluded.',
    'No backend API route, database write, persistent public lookup, account, payment, analytics, or AI is used.',
    'Delete-token behavior is simulated locally before any real persistence is introduced.'
  ];
}

function buildLifecycleSteps(status: PublicLinkLifecycleUiStatus): readonly PublicLinkLifecycleStep[] {
  return [
    {
      label: 'Create',
      status: status === 'idle' ? 'pending' : 'complete',
      detail: status === 'idle' ? 'Waiting for local stub creation.' : 'A minimized DTO stub was created locally.'
    },
    {
      label: 'Preview',
      status: status === 'created' || status === 'delete-rejected' ? 'complete' : status === 'deleted' ? 'blocked' : 'pending',
      detail: status === 'deleted' ? 'Preview is blocked after local deletion.' : 'Preview uses /r/preview and current browser state only.'
    },
    {
      label: 'Delete-token check',
      status: status === 'delete-rejected' ? 'blocked' : status === 'deleted' ? 'complete' : 'pending',
      detail: status === 'delete-rejected' ? 'Wrong token rejected; local stub remains active.' : 'Deletion requires the local delete token.'
    },
    {
      label: 'Persistence',
      status: 'blocked',
      detail: 'Real persistence, database lookup, public ID route, and backend API remain blocked in Phase 6.3.'
    }
  ];
}
