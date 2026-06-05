import Link from 'next/link';
import { PhaseBadge } from '@/components/PhaseBadge';
import {
  landingCtas,
  landingMethodSteps,
  landingScopeGuards,
  landingTrustCards
} from '@/features/landing/landingPresentation';

export default function HomePage() {
  return (
    <main className="page-shell landing-shell">
      <section className="hero-grid landing-hero-grid" aria-labelledby="landing-title">
        <div className="panel hero-panel landing-hero-panel">
          <PhaseBadge label="Phase 2.6 trust UX" />
          <p className="kicker">The 20 Corridors</p>
          <h1 id="landing-title">Walk through 20 symbolic corridors.</h1>
          <p className="lede">
            A reflective decision-pattern game that maps how a player handles uncertainty, control,
            relationships, ambiguity, and motive signals. The report is deterministic, evidence-linked,
            and built from the choices made inside the corridors.
          </p>
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
          <div className="rule-list landing-rule-list">
            <span>Choose quickly. One answer only.</span>
            <span>No global A/B/C/D meanings. Every option has question-specific evidence.</span>
            <span>Contradictions are treated as signal, not noise.</span>
          </div>
        </aside>
      </section>

      <section className="landing-section" aria-labelledby="trust-title">
        <div className="section-heading">
          <p className="kicker">Trust model</p>
          <h2 id="trust-title">Mystery in the interface. Discipline in the engine.</h2>
          <p className="lede">
            The page can feel cinematic, but the result must stay explainable. These are the current
            trust rules behind the experience.
          </p>
        </div>
        <div className="landing-trust-grid">
          {landingTrustCards.map((card) => (
            <article className="landing-trust-card" key={card.title}>
              <span>{card.eyebrow}</span>
              <h3>{card.title}</h3>
              <p>{card.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-section landing-method-section" aria-labelledby="method-title">
        <div className="section-heading">
          <p className="kicker">Method preview</p>
          <h2 id="method-title">How the result is built.</h2>
          <p className="lede">
            The app does not score letters globally. It scores the meaning of each selected option,
            then resolves axes, contradictions, and the final report structure.
          </p>
        </div>
        <div className="landing-method-list">
          {landingMethodSteps.map((step) => (
            <article className="landing-method-card" key={step.index}>
              <strong>{step.index}</strong>
              <div>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="panel landing-scope-panel" aria-labelledby="scope-title">
        <div className="section-heading">
          <p className="kicker">Scope boundary</p>
          <h2 id="scope-title">What exists now, and what is intentionally blocked.</h2>
        </div>
        <div className="landing-scope-grid">
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
