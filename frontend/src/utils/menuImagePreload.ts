/** Quantas fotos do cardálogo antecipar no /menu (primeira dobra + pouco scroll). */
export const MENU_IMAGE_PRELOAD_COUNT = 12;

/** Prioridade alta para os N primeiros cards (eager + fetchPriority). */
export const MENU_IMAGE_PRIORITY_COUNT = 8;

export function collectMenuImageHrefs(products: { imageUrl?: string }[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const p of products) {
    const u = p.imageUrl?.trim();
    if (!u || seen.has(u)) continue;
    seen.add(u);
    out.push(u);
    if (out.length >= MENU_IMAGE_PRELOAD_COUNT) break;
  }
  return out;
}

const preconnectedOrigins = new Set<string>();

/** Liga cedo TLS/DNS ao host das fotos (uma vez por origem por sessão). */
export function preconnectToImageOrigin(href: string): void {
  try {
    const origin = new URL(href).origin;
    if (preconnectedOrigins.has(origin)) return;
    preconnectedOrigins.add(origin);
    const link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = origin;
    document.head.appendChild(link);
  } catch {
    /* URL inválida */
  }
}

export function injectImagePreloads(hrefs: string[]): () => void {
  const links: HTMLLinkElement[] = [];
  const attr = 'data-macaw-menu-preload';
  for (const href of hrefs) {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = href;
    link.setAttribute(attr, '');
    document.head.appendChild(link);
    links.push(link);
  }
  return () => {
    for (const l of links) l.remove();
  };
}
