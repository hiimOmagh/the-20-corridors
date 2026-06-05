import Link from 'next/link';
import { PhaseBadge } from '@/components/PhaseBadge';

export default function HomePage() {
  return (
    <main className="page-shell">
      <section className="hero-grid">
        <div className="panel hero-panel">
          <PhaseBadge label="Phase 2.0 scaffold" />
          <p className="kicker">The 20 Corridors</p>
          <h1>Walk through 20 symbolic choices.</h1>
          <p className="lede">
            A reflective decision-pattern game that maps how a player handles uncertainty, control,
            relationships, ambiguity, and deep motive signals. The engine is deterministic and every
            result is built from answer evidence.
          </p>
          <div className="actions">
            <Link className="button" href="/quiz">Start the corridors</Link>
            <Link className="button secondary" href="/results">View saved result</Link>
          </div>
          <p className="small" style={{ marginTop: 24 }}>
            This is a symbolic reflective game, not a clinical or diagnostic psychological assessment.
          </p>
        </div>
        <aside className="panel corridor-card" aria-label="Game principles">
          <div className="corridor-lines" />
          <div className="rule-list">
            <span>Choose quickly. One answer only.</span>
            <span>No global A/B/C/D meanings. Every option has question-specific evidence.</span>
            <span>Contradictions are treated as signal, not noise.</span>
          </div>
        </aside>
      </section>
    </main>
  );
}
