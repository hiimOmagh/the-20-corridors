import Link from 'next/link';
import { PhaseBadge } from '@/components/PhaseBadge';
import { visualIdentityPrinciples, visualIdentityTokens } from '@/features/visual/visualIdentity';
import {
  landingCtas,
  landingMethodSteps,
  landingScopeGuards,
  landingTrustCards
} from '@/features/landing/landingPresentation';
import {
  getLandingScopeSummary,
  getLandingToneClass,
  landingContinuityMarkers,
  landingSectionIndex,
  landingTrustSignals
} from '@/features/landing/landingVisualConsistency';

const includedScopeCount = landingScopeGuards.filter((guard) => guard.status === 'included').length;
const excludedScopeCount = landingScopeGuards.filter((guard) => guard.status === 'excluded').length;

export default function HomePage() {
  return (
    <main className="page-shell landing-shell">
      <section className="landing-index-panel" aria-label="Landing section index">
        {landingSectionIndex.map((section) => (
          <a className={`landing-index-link ${getLandingToneClass(section.tone)}`} href={section.href} key={section.href}>
            <span>{section.index}</span>
            <strong>{section.label}</strong>
          </a>
        ))}
      </section>

      <section className="hero-grid landing-hero-grid" aria-labelledby="landing-title">
        <div className="panel hero-panel landing-hero-panel">
          <PhaseBadge label="Phase 3.4 landing consistency" />
          <p className="kicker">The 20 Corridors</p>
          <h1 id="landing-title">Walk through 20 symbolic corridors.</h1>
          <p className="lede">
            A reflective decision-pattern game that maps how a player handles uncertainty, control,
            relationships, ambiguity, and motive signals. The report is deterministic, evidence-linked,
            and built from the choices made inside the corridors.
          </p>
          <div className="landing-continuity-strip" aria-label="Current product boundaries">
            {landingContinuityMarkers.map((marker) => (
              <span className={`landing-continuity-chip ${getLandingToneClass(marker.tone)}`} key={marker.label}>
                <small>{marker.label}</small>
                <strong>{marker.value}</strong>
              </span>
            ))}
          </div>
          <div className="actions landing-actions" aria-label="Primary actions">
            {landingCtas.map((cta) => (
              <Link className={cta.variant === 'primary' ? 'button' : 'button secondary'} href={cta.href} key={cta.href}>
                {cta.label}
              </Link>
            ))}
          </div>
          <div className="landing-disclaimer" role="note" aria-label="Non-clinical disclaimer">
            <strong>Reflective game, not a diagnosis.</strong>
            <span>
              The 20 Corridors analyzes symbolic choices and repeated decision patterns. It is not a
              clinical, diagnostic, or scientifically validated psychological assessment.
            </span>
          </div>
        </div>
        <aside className="panel corridor-card landing-corridor-card" aria-label="Corridor rules">
          <div className="corridor-lines landing-corridor-lines" aria-hidden="true" />
          <div className="landing-trust-signal-strip" aria-label="Prototype trust facts">
            {landingTrustSignals.map((signal) => (
              <span key={signal.label}>
                <strong>{signal.label}</strong>
                <small>{signal.value}</small>
              </span>
            ))}
          </div>
          <div className="rule-list landing-rule-list">
            <span>Choose quickly. One answer only.</span>
            <span>No global A/B/C/D meanings. Every option has question-specific evidence.</span>
            <span>Contradictions are treated as signal, not noise.</span>
          </div>
        </aside>
      </section>

      <section className="panel landing-visual-system-panel landing-balanced-section" aria-labelledby="visual-system-title">
        <div className="section-heading landing-section-heading-balanced">
          <p className="kicker">Visual identity system</p>
          <h2 id="visual-system-title">A corridor atmosphere with explicit design rules.</h2>
          <p className="lede">
            Phase 3.4 brings the landing page into the same rhythm as the quiz and result surfaces: a
            visible section path, tighter trust hierarchy, stronger CTA cadence, and mobile-safe spacing.
          </p>
        </div>
        <div className="identity-principle-grid landing-principle-grid-balanced">
          {visualIdentityPrinciples.map((principle, index) => (
            <article className="identity-principle-card landing-principle-card-balanced" key={principle.title}>
              <span className="landing-card-index">{String(index + 1).padStart(2, '0')}</span>
              <h3>{principle.title}</h3>
              <p>{principle.rule}</p>
            </article>
          ))}
        </div>
        <div className="identity-token-strip landing-token-strip-balanced" aria-label="Visual identity token preview">
          {visualIdentityTokens.slice(0, 5).map((token) => (
            <span className={`identity-token-chip ${token.category}`} key={token.cssVariable}>
              {token.name}
            </span>
          ))}
        </div>
      </section>

      <section className="landing-section landing-balanced-section" aria-labelledby="trust-title">
        <div className="section-heading landing-section-heading-balanced">
          <p className="kicker">Trust model</p>
          <h2 id="trust-title">Mystery in the interface. Discipline in the engine.</h2>
          <p className="lede">
            The page can feel cinematic, but the result must stay explainable. These are the current
            trust rules behind the experience.
          </p>
        </div>
        <div className="landing-trust-grid landing-trust-grid-balanced">
          {landingTrustCards.map((card, index) => (
            <article className={`landing-trust-card landing-trust-card-balanced landing-tone-card-${index + 1}`} key={card.title}>
              <span>{card.eyebrow}</span>
              <strong className="landing-card-index">{String(index + 1).padStart(2, '0')}</strong>
              <h3>{card.title}</h3>
              <p>{card.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-section landing-method-section landing-balanced-section" aria-labelledby="method-title">
        <div className="section-heading landing-section-heading-balanced">
          <p className="kicker">Method preview</p>
          <h2 id="method-title">How the result is built.</h2>
          <p className="lede">
            The app does not score letters globally. It scores the meaning of each selected option,
            then resolves axes, contradictions, and the final report structure.
          </p>
        </div>
        <div className="landing-method-list landing-method-list-balanced">
          {landingMethodSteps.map((step) => (
            <article className="landing-method-card landing-method-card-balanced" key={step.index}>
              <strong>{step.index}</strong>
              <div>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="panel landing-scope-panel landing-balanced-section" aria-labelledby="scope-title">
        <div className="section-heading landing-section-heading-balanced landing-scope-heading-balanced">
          <div>
            <p className="kicker">Scope boundary</p>
            <h2 id="scope-title">What exists now, and what is intentionally blocked.</h2>
          </div>
          <span className="landing-scope-summary">{getLandingScopeSummary(includedScopeCount, excludedScopeCount)}</span>
        </div>
        <div className="landing-scope-grid landing-scope-grid-balanced">
          {landingScopeGuards.map((guard) => (
            <div className={`landing-scope-pill ${guard.status}`} key={guard.label}>
              <span>{guard.status === 'included' ? 'Included' : 'Blocked'}</span>
              <strong>{guard.label}</strong>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
