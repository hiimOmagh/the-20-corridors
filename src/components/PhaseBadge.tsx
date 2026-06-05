export function PhaseBadge({ label }: Readonly<{ label: string }>) {
  return (
    <span
      style={{
        alignSelf: 'flex-start',
        border: '1px solid rgba(125, 211, 252, 0.28)',
        borderRadius: 999,
        color: 'var(--accent)',
        display: 'inline-flex',
        fontSize: '0.74rem',
        fontWeight: 800,
        letterSpacing: '0.14em',
        marginBottom: 24,
        padding: '8px 12px',
        textTransform: 'uppercase'
      }}
    >
      {label}
    </span>
  );
}
