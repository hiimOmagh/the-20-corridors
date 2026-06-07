import { buildPublicResultLookupPageAccessibility } from '@/core/public-link/publicResultLookupPageAccessibility';
import { buildPublicResultLookupPageCopy } from '@/core/public-link/publicResultLookupPageCopy';
import { buildPublicResultShareCopyUx } from '@/core/public-link/publicResultShareCopyUx';
import { resolvePublicResultLookupPageImplementationView } from '@/core/public-link/publicResultLookupPageImplementation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface PublicResultLookupPageProps {
  readonly params: Promise<{ readonly publicId: string }>;
}

export default async function PublicResultLookupPage(props: PublicResultLookupPageProps) {
  const { publicId } = await props.params;
  const view = await resolvePublicResultLookupPageImplementationView({
    publicId,
    context: 'public-result-page'
  });
  const copy = buildPublicResultLookupPageCopy({
    status: view.status,
    httpStatus: view.httpStatus,
    dto: view.dto
  });
  const shareCopy = buildPublicResultShareCopyUx({
    status: view.status,
    httpStatus: view.httpStatus,
    dto: view.dto,
    publicPath: `/r/${publicId}`
  });
  const accessibility = buildPublicResultLookupPageAccessibility({
    status: view.status,
    httpStatus: view.httpStatus,
    dto: view.dto,
    shareCopy
  });

  if (view.dto === null) {
    return (
      <main
        aria-describedby={`${accessibility.pageSummaryId} ${accessibility.pageExplanationId}`}
        aria-label={accessibility.mainLandmarkLabel}
        aria-labelledby={accessibility.pageTitleId}
        data-public-result-page="true"
        data-lookup-status={view.status}
        data-copy-tone={copy.tone}
        data-share-copy-ux={shareCopy.availability}
        data-accessibility-semantics="phase-9.2"
        data-status-role={accessibility.statusRole}
        className="min-h-screen px-6 py-12"
      >
        <section
          aria-describedby={`${accessibility.pageSummaryId} ${accessibility.pageExplanationId} ${accessibility.pageRecoveryId}`}
          aria-labelledby={accessibility.pageTitleId}
          aria-live={accessibility.statusAriaLive}
          aria-label={accessibility.statusRegionLabel}
          role={accessibility.statusRole}
          data-unavailable-state-non-actionable={accessibility.unavailableStateNonActionable ? 'true' : 'false'}
          className="mx-auto max-w-3xl rounded-3xl border border-white/10 bg-white/[0.03] p-8 shadow-2xl"
        >
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">{copy.eyebrow}</p>
          <h1 id={accessibility.pageTitleId} className="mt-4 text-3xl font-semibold text-white">
            {copy.title}
          </h1>
          <p id={accessibility.pageSummaryId} className="mt-4 text-sm leading-7 text-white/75">
            {copy.summary}
          </p>
          <p id={accessibility.pageExplanationId} className="mt-3 text-sm leading-7 text-white/65">
            {copy.explanation}
          </p>
          <p id={accessibility.pageRecoveryId} className="mt-3 text-sm leading-7 text-white/60">
            {copy.recovery}
          </p>
          <p
            id={accessibility.statusRegionId}
            aria-label={accessibility.statusRegionLabel}
            className="mt-6 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-xs text-white/50"
          >
            {copy.statusLabel} · {copy.statusDetail}
          </p>
        </section>
      </main>
    );
  }

  return (
    <main
      aria-describedby={`${accessibility.pageSummaryId} ${accessibility.pageExplanationId}`}
      aria-label={accessibility.mainLandmarkLabel}
      aria-labelledby={accessibility.pageTitleId}
      data-public-result-page="true"
      data-lookup-status={view.status}
      data-copy-tone={copy.tone}
      data-share-copy-ux={shareCopy.availability}
      data-accessibility-semantics="phase-9.2"
      data-status-role={accessibility.statusRole}
      className="min-h-screen px-6 py-12"
    >
      <article
        aria-describedby={`${accessibility.pageSummaryId} ${accessibility.pageExplanationId}`}
        aria-labelledby={accessibility.pageTitleId}
        className="mx-auto max-w-4xl rounded-3xl border border-white/10 bg-white/[0.03] p-8 shadow-2xl"
      >
        <p className="text-xs uppercase tracking-[0.3em] text-white/50">{copy.eyebrow}</p>
        <h1 id={accessibility.pageTitleId} className="mt-4 text-4xl font-semibold text-white">
          {copy.title}
        </h1>
        <p id={accessibility.pageSummaryId} className="mt-4 text-base leading-8 text-white/75">
          {copy.summary}
        </p>
        <p id={accessibility.pageExplanationId} className="mt-3 text-sm leading-7 text-white/60">
          {copy.explanation}
        </p>

        <section
          id={accessibility.factsRegionId}
          aria-label={accessibility.factsRegionLabel}
          aria-labelledby={accessibility.factsHeadingId}
          className="mt-8 grid gap-4 md:grid-cols-3"
        >
          <h2 id={accessibility.factsHeadingId} className="sr-only">
            {accessibility.factsRegionLabel}
          </h2>
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-white/45">Confidence</p>
            <p className="mt-2 text-lg font-medium text-white">{view.dto.confidenceBand}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-white/45">Deep motive</p>
            <p className="mt-2 text-lg font-medium text-white">{view.dto.deepMotive.label}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-white/45">Expires</p>
            <p className="mt-2 text-lg font-medium text-white">{new Date(view.dto.expiresAt).toLocaleDateString('en-GB')}</p>
          </div>
        </section>

        <section
          id={accessibility.overviewRegionId}
          aria-label={accessibility.overviewRegionLabel}
          aria-labelledby={accessibility.overviewHeadingId}
          className="mt-8 rounded-2xl border border-white/10 bg-black/20 p-5"
        >
          <h2 id={accessibility.overviewHeadingId} className="text-xl font-semibold text-white">
            Public overview
          </h2>
          <p className="mt-3 text-sm leading-7 text-white/70">{view.dto.reportOverview.patternSummary}</p>
          <p className="mt-4 text-sm text-white/60">Primary axis: {view.dto.reportOverview.primaryAxis}</p>
        </section>

        <section
          id={accessibility.axisRegionId}
          aria-label={accessibility.axisRegionLabel}
          aria-labelledby={accessibility.axisHeadingId}
          className="mt-8 grid gap-4 md:grid-cols-2"
        >
          <h2 id={accessibility.axisHeadingId} className="sr-only">
            {accessibility.axisRegionLabel}
          </h2>
          {view.dto.axisSummaries.slice(0, 4).map((axis) => (
            <div key={axis.id} className="rounded-2xl border border-white/10 bg-black/20 p-5">
              <p className="text-sm font-semibold text-white">{axis.label}</p>
              <p className="mt-2 text-xs uppercase tracking-[0.2em] text-white/45">{axis.band}</p>
              <p className="mt-3 text-sm leading-6 text-white/65">{axis.interpretation}</p>
            </div>
          ))}
        </section>

        {shareCopy.canOfferCopyAction ? (
          <section
            id={accessibility.shareRegionId}
            aria-describedby={accessibility.shareHelpId}
            aria-label={accessibility.shareRegionLabel}
            aria-labelledby={accessibility.shareHeadingId}
            data-share-copy-panel="available"
            className="mt-8 rounded-2xl border border-white/10 bg-black/20 p-5"
          >
            <p id={accessibility.shareHeadingId} className="text-xs uppercase tracking-[0.2em] text-white/45">
              {shareCopy.heading}
            </p>
            <p className="mt-3 text-sm leading-7 text-white/70">{shareCopy.instruction}</p>
            <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <p aria-label={accessibility.shareActionAriaLabel} className="text-sm font-semibold text-white">
                {shareCopy.primaryActionLabel}
              </p>
              <p className="mt-2 text-xs uppercase tracking-[0.2em] text-white/45">{shareCopy.manualCopyLabel}</p>
              <code className="mt-2 block break-all rounded-xl bg-black/30 px-3 py-2 text-sm text-white/75">
                {shareCopy.manualCopyValue}
              </code>
            </div>
            <p id={accessibility.shareHelpId} className="mt-3 text-xs leading-6 text-white/50">
              {shareCopy.fallbackInstruction} {accessibility.shareHelpText}
            </p>
          </section>
        ) : null}

        <p
          id={accessibility.statusRegionId}
          aria-label={accessibility.statusRegionLabel}
          aria-live={accessibility.statusAriaLive}
          role={accessibility.statusRole}
          className="mt-8 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-xs text-white/50"
        >
          {copy.statusLabel} · {copy.statusDetail}. <span id={accessibility.pageRecoveryId}>{copy.recovery}</span>
        </p>
      </article>
    </main>
  );
}
