import type { LocalShareCardPreview } from '@/features/results/resultShareCard';

export const LOCAL_SHARE_IMAGE_EXPORT_SCHEMA_VERSION = 'phase-4.1-local-share-card-image-export-v1' as const;
export const LOCAL_SHARE_IMAGE_EXPORT_BOUNDARY_NOTE = 'Local PNG export only. No upload, account, public URL, or answer-level data.' as const;
export const LOCAL_SHARE_IMAGE_EXPORT_WIDTH = 1200 as const;
export const LOCAL_SHARE_IMAGE_EXPORT_HEIGHT = 1600 as const;

export type LocalShareImageExportStatus = 'idle' | 'exporting' | 'exported' | 'unsupported' | 'failed';

export interface LocalShareImageExportPayload {
  readonly schemaVersion: typeof LOCAL_SHARE_IMAGE_EXPORT_SCHEMA_VERSION;
  readonly fileName: string;
  readonly width: typeof LOCAL_SHARE_IMAGE_EXPORT_WIDTH;
  readonly height: typeof LOCAL_SHARE_IMAGE_EXPORT_HEIGHT;
  readonly title: string;
  readonly subtitle: string;
  readonly pattern: string;
  readonly signature: string;
  readonly traitLine: string;
  readonly mainTension: string;
  readonly confidence: string;
  readonly deepMotive: string;
  readonly boundaryNote: typeof LOCAL_SHARE_IMAGE_EXPORT_BOUNDARY_NOTE;
}

export interface LocalShareImageExportResult {
  readonly status: Exclude<LocalShareImageExportStatus, 'idle' | 'exporting'>;
  readonly fileName: string;
  readonly message: string;
}

export function buildLocalShareImageExportPayload(card: LocalShareCardPreview): LocalShareImageExportPayload {
  return {
    schemaVersion: LOCAL_SHARE_IMAGE_EXPORT_SCHEMA_VERSION,
    fileName: buildLocalShareImageFileName(card),
    width: LOCAL_SHARE_IMAGE_EXPORT_WIDTH,
    height: LOCAL_SHARE_IMAGE_EXPORT_HEIGHT,
    title: card.title,
    subtitle: card.subtitle,
    pattern: card.pattern,
    signature: card.signature,
    traitLine: card.traitLine,
    mainTension: card.mainTension,
    confidence: card.confidence,
    deepMotive: card.deepMotive,
    boundaryNote: LOCAL_SHARE_IMAGE_EXPORT_BOUNDARY_NOTE
  };
}

export function buildLocalShareImageFileName(card: Pick<LocalShareCardPreview, 'title'>): string {
  const slug = card.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 72) || 'corridors-result';

  return `the-20-corridors-${slug}.png`;
}

export function buildLocalShareCardExportSvg(card: LocalShareCardPreview): string {
  const payload = buildLocalShareImageExportPayload(card);
  const patternLines = wrapSvgText(payload.pattern, 48, 4);
  const signatureLines = wrapSvgText(payload.signature, 42, 2);
  const tensionLines = wrapSvgText(payload.mainTension, 44, 3);
  const traitLines = wrapSvgText(payload.traitLine, 46, 2);

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${payload.width}" height="${payload.height}" viewBox="0 0 ${payload.width} ${payload.height}" role="img" aria-label="${escapeXml(payload.title)} share card">`,
    '<defs>',
    '<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#030712"/><stop offset="48%" stop-color="#0f172a"/><stop offset="100%" stop-color="#1e1b4b"/></linearGradient>',
    '<radialGradient id="orbA" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="#7dd3fc" stop-opacity="0.46"/><stop offset="100%" stop-color="#7dd3fc" stop-opacity="0"/></radialGradient>',
    '<radialGradient id="orbB" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="#facc15" stop-opacity="0.26"/><stop offset="100%" stop-color="#facc15" stop-opacity="0"/></radialGradient>',
    '<filter id="shadow" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="26" stdDeviation="26" flood-color="#000000" flood-opacity="0.38"/></filter>',
    '</defs>',
    '<rect width="1200" height="1600" fill="url(#bg)"/>',
    '<circle cx="1040" cy="190" r="370" fill="url(#orbA)"/>',
    '<circle cx="150" cy="1340" r="460" fill="url(#orbB)"/>',
    '<path d="M112 164 H1088" stroke="#7dd3fc" stroke-width="2" stroke-opacity="0.28"/>',
    '<path d="M112 1436 H1088" stroke="#facc15" stroke-width="2" stroke-opacity="0.24"/>',
    '<rect x="88" y="104" width="1024" height="1392" rx="56" fill="#020617" fill-opacity="0.72" stroke="#7dd3fc" stroke-opacity="0.26" filter="url(#shadow)"/>',
    '<rect x="126" y="142" width="948" height="1316" rx="40" fill="none" stroke="#facc15" stroke-opacity="0.18"/>',
    svgText({ x: 156, y: 226, text: 'The 20 Corridors', size: 35, color: '#7dd3fc', weight: 800, letterSpacing: 4 }),
    svgText({ x: 156, y: 304, text: payload.title, size: 74, color: '#f8fafc', weight: 900 }),
    svgText({ x: 156, y: 368, text: payload.subtitle, size: 26, color: '#cbd5e1', weight: 650 }),
    svgMultiline({ x: 156, y: 482, lines: patternLines, size: 38, lineHeight: 56, color: '#e2e8f0', weight: 700 }),
    svgLabelBox({ x: 156, y: 772, label: 'Corridor signature', lines: signatureLines, accent: '#7dd3fc' }),
    svgLabelBox({ x: 156, y: 970, label: 'Dominant traits', lines: traitLines, accent: '#facc15' }),
    svgLabelBox({ x: 156, y: 1168, label: 'Main tension', lines: tensionLines, accent: '#fda4af' }),
    svgMetric({ x: 156, y: 1360, label: 'Consistency', value: payload.confidence }),
    svgMetric({ x: 438, y: 1360, label: 'Motive', value: payload.deepMotive }),
    svgText({ x: 156, y: 1440, text: payload.boundaryNote, size: 23, color: '#94a3b8', weight: 650 }),
    '</svg>'
  ].join('');
}

export function getLocalShareImageExportStatusCopy(status: LocalShareImageExportStatus): string {
  switch (status) {
    case 'idle':
      return 'Local PNG export is ready. The image is generated in this browser from the share-card summary only.';
    case 'exporting':
      return 'Generating local PNG from the share-card surface...';
    case 'exported':
      return 'Local PNG export completed.';
    case 'unsupported':
      return 'PNG export is not supported in this browser context. Copy the share text instead.';
    case 'failed':
      return 'PNG export failed. Copy the share text or retry in another browser.';
  }
}

export async function exportLocalShareCardPng(card: LocalShareCardPreview): Promise<LocalShareImageExportResult> {
  const fileName = buildLocalShareImageFileName(card);

  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return {
      status: 'unsupported',
      fileName,
      message: getLocalShareImageExportStatusCopy('unsupported')
    };
  }

  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  const image = new Image();

  if (!context || typeof canvas.toBlob !== 'function' || !window.URL?.createObjectURL) {
    return {
      status: 'unsupported',
      fileName,
      message: getLocalShareImageExportStatusCopy('unsupported')
    };
  }

  const svg = buildLocalShareCardExportSvg(card);
  const svgBlob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
  const svgUrl = window.URL.createObjectURL(svgBlob);

  try {
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error('local_share_image_load_failed'));
      image.src = svgUrl;
    });

    canvas.width = LOCAL_SHARE_IMAGE_EXPORT_WIDTH;
    canvas.height = LOCAL_SHARE_IMAGE_EXPORT_HEIGHT;
    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    const pngBlob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((blob) => resolve(blob), 'image/png', 0.94);
    });

    if (!pngBlob) {
      return {
        status: 'failed',
        fileName,
        message: getLocalShareImageExportStatusCopy('failed')
      };
    }

    const pngUrl = window.URL.createObjectURL(pngBlob);
    const anchor = document.createElement('a');
    anchor.href = pngUrl;
    anchor.download = fileName;
    anchor.rel = 'noopener';
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => window.URL.revokeObjectURL(pngUrl), 0);

    return {
      status: 'exported',
      fileName,
      message: getLocalShareImageExportStatusCopy('exported')
    };
  } catch {
    return {
      status: 'failed',
      fileName,
      message: getLocalShareImageExportStatusCopy('failed')
    };
  } finally {
    window.URL.revokeObjectURL(svgUrl);
  }
}

function wrapSvgText(value: string, maxLineLength: number, maxLines: number): readonly string[] {
  const words = value.replace(/\s+/g, ' ').trim().split(' ').filter(Boolean);
  const lines: string[] = [];

  for (const word of words) {
    if (lines.length === 0) {
      lines.push(word);
      continue;
    }

    const current = lines[lines.length - 1] ?? '';
    const next = current.length > 0 ? `${current} ${word}` : word;

    if (next.length <= maxLineLength) {
      lines[lines.length - 1] = next;
      continue;
    }

    if (lines.length >= maxLines) break;
    lines.push(word);
  }

  const trimmed = lines.slice(0, maxLines);
  if (words.join(' ').length > trimmed.join(' ').length && trimmed.length > 0) {
    const lastIndex = trimmed.length - 1;
    const lastLine = trimmed[lastIndex] ?? '';
    trimmed[lastIndex] = `${lastLine.replace(/[.。،,;:!?…]+$/u, '')}…`;
  }

  return trimmed.length > 0 ? trimmed : ['No summary available'];
}

function svgText(input: Readonly<{ x: number; y: number; text: string; size: number; color: string; weight: number; letterSpacing?: number }>): string {
  const letterSpacing = input.letterSpacing !== undefined ? ` letter-spacing="${input.letterSpacing}"` : '';
  return `<text x="${input.x}" y="${input.y}" fill="${input.color}" font-family="Inter, Arial, sans-serif" font-size="${input.size}" font-weight="${input.weight}"${letterSpacing}>${escapeXml(input.text)}</text>`;
}

function svgMultiline(input: Readonly<{ x: number; y: number; lines: readonly string[]; size: number; lineHeight: number; color: string; weight: number }>): string {
  return input.lines.map((line, index) => svgText({
    x: input.x,
    y: input.y + index * input.lineHeight,
    text: line,
    size: input.size,
    color: input.color,
    weight: input.weight
  })).join('');
}

function svgLabelBox(input: Readonly<{ x: number; y: number; label: string; lines: readonly string[]; accent: string }>): string {
  const height = Math.max(130, 84 + input.lines.length * 38);
  return [
    `<rect x="${input.x}" y="${input.y}" width="888" height="${height}" rx="26" fill="#0f172a" fill-opacity="0.72" stroke="${input.accent}" stroke-opacity="0.24"/>`,
    svgText({ x: input.x + 30, y: input.y + 46, text: input.label, size: 22, color: input.accent, weight: 850, letterSpacing: 2 }),
    svgMultiline({ x: input.x + 30, y: input.y + 96, lines: input.lines, size: 28, lineHeight: 38, color: '#f8fafc', weight: 800 })
  ].join('');
}

function svgMetric(input: Readonly<{ x: number; y: number; label: string; value: string }>): string {
  return [
    `<rect x="${input.x}" y="${input.y}" width="252" height="92" rx="24" fill="#020617" fill-opacity="0.62" stroke="#7dd3fc" stroke-opacity="0.22"/>`,
    svgText({ x: input.x + 24, y: input.y + 35, text: input.label, size: 19, color: '#7dd3fc', weight: 850, letterSpacing: 1 }),
    svgText({ x: input.x + 24, y: input.y + 70, text: input.value.slice(0, 18), size: 24, color: '#f8fafc', weight: 850 })
  ].join('');
}

function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}
