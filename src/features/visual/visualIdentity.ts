export type VisualTokenCategory = 'color' | 'surface' | 'radius' | 'shadow' | 'motion' | 'spacing';

export interface VisualIdentityToken {
  readonly name: string;
  readonly cssVariable: string;
  readonly category: VisualTokenCategory;
  readonly usage: string;
}

export interface VisualIdentityPrinciple {
  readonly title: string;
  readonly rule: string;
}

export const visualIdentityTokens: readonly VisualIdentityToken[] = [
  {
    name: 'Void base',
    cssVariable: '--color-void',
    category: 'color',
    usage: 'Primary page background and deep corridor edges.'
  },
  {
    name: 'Nocturne panel',
    cssVariable: '--surface-panel',
    category: 'surface',
    usage: 'Glass-panel base for landing, quiz, and report cards.'
  },
  {
    name: 'Signal cyan',
    cssVariable: '--color-signal',
    category: 'color',
    usage: 'Primary action, evidence chips, progress, and report highlights.'
  },
  {
    name: 'Violet echo',
    cssVariable: '--color-echo',
    category: 'color',
    usage: 'Secondary atmospheric glow and corridor depth accents.'
  },
  {
    name: 'Gold threshold',
    cssVariable: '--color-threshold',
    category: 'color',
    usage: 'Premium visual accent for identity signatures and key thresholds.'
  },
  {
    name: 'Glass line',
    cssVariable: '--line',
    category: 'surface',
    usage: 'Default card and section separators.'
  },
  {
    name: 'Large corridor radius',
    cssVariable: '--radius-lg',
    category: 'radius',
    usage: 'Main panels and report sections.'
  },
  {
    name: 'Controlled lift',
    cssVariable: '--motion-fast',
    category: 'motion',
    usage: 'Small hover transitions only; never critical for comprehension.'
  }
] as const;

export const visualIdentityPrinciples: readonly VisualIdentityPrinciple[] = [
  {
    title: 'Mystery through depth, not clutter',
    rule: 'Use layered gradients, corridor lines, and quiet glows instead of decorative overload.'
  },
  {
    title: 'Trust through stable structure',
    rule: 'Cards, evidence, and report sections keep predictable spacing and visible borders.'
  },
  {
    title: 'Signal hierarchy before ornament',
    rule: 'Primary actions and evidence markers use signal cyan; secondary atmosphere uses violet and gold sparingly.'
  },
  {
    title: 'Motion must be optional',
    rule: 'All animation has reduced-motion fallbacks and no information depends on animation.'
  }
] as const;

export function getVisualIdentityTokenNames(): readonly string[] {
  return visualIdentityTokens.map((token) => token.name);
}

export function getVisualIdentityPrincipleTitles(): readonly string[] {
  return visualIdentityPrinciples.map((principle) => principle.title);
}
