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

  if (view.dto === null) {
    return (
      <main
        data-public-result-page="true"
        data-lookup-status={view.status}
        data-copy-tone={copy.tone}
        data-share-copy-ux={shareCopy.availability}
        className="min-h-screen px-6 py-12"
      >
        <section className="mx-auto max-w-3xl rounded-3xl border border-white/10 bg-white/[0.03] p-8 shadow-2xl">
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">{copy.eyebrow}</p>
          <h1 className="mt-4 text-3xl font-semibold text-white">{copy.title}</h1>
          <p className="mt-4 text-sm leading-7 text-white/75">{copy.summary}</p>
          <p className="mt-3 text-sm leading-7 text-white/65">{copy.explanation}</p>
          <p className="mt-3 text-sm leading-7 text-white/60">{copy.recovery}</p>
          <p className="mt-6 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-xs text-white/50">
            {copy.statusLabel} · {copy.statusDetail}
          </p>
        </section>
      </main>
    );
  }

  return (
    <main
      data-public-result-page="true"
      data-lookup-status={view.status}
      data-copy-tone={copy.tone}
      data-share-copy-ux={shareCopy.availability}
      className="min-h-screen px-6 py-12"
    >
      <article className="mx-auto max-w-4xl rounded-3xl border border-white/10 bg-white/[0.03] p-8 shadow-2xl">
        <p className="text-xs uppercase tracking-[0.3em] text-white/50">{copy.eyebrow}</p>
        <h1 className="mt-4 text-4xl font-semibold text-white">{copy.title}</h1>
        <p className="mt-4 text-base leading-8 text-white/75">{copy.summary}</p>
        <p className="mt-3 text-sm leading-7 text-white/60">{copy.explanation}</p>

        <section className="mt-8 grid gap-4 md:grid-cols-3">
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

        <section className="mt-8 rounded-2xl border border-white/10 bg-black/20 p-5">
          <h2 className="text-xl font-semibold text-white">Public overview</h2>
          <p className="mt-3 text-sm leading-7 text-white/70">{view.dto.reportOverview.patternSummary}</p>
          <p className="mt-4 text-sm text-white/60">Primary axis: {view.dto.reportOverview.primaryAxis}</p>
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-2">
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
            data-share-copy-panel="available"
            className="mt-8 rounded-2xl border border-white/10 bg-black/20 p-5"
          >
            <p className="text-xs uppercase tracking-[0.2em] text-white/45">{shareCopy.heading}</p>
            <p className="mt-3 text-sm leading-7 text-white/70">{shareCopy.instruction}</p>
            <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-sm font-semibold text-white">{shareCopy.primaryActionLabel}</p>
              <p className="mt-2 text-xs uppercase tracking-[0.2em] text-white/45">{shareCopy.manualCopyLabel}</p>
              <code className="mt-2 block break-all rounded-xl bg-black/30 px-3 py-2 text-sm text-white/75">
                {shareCopy.manualCopyValue}
              </code>
            </div>
            <p className="mt-3 text-xs leading-6 text-white/50">{shareCopy.fallbackInstruction}</p>
          </section>
        ) : null}

        <p className="mt-8 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-xs text-white/50">
          {copy.statusLabel} · {copy.statusDetail}. {copy.recovery}
        </p>
      </article>
    </main>
  );
}
