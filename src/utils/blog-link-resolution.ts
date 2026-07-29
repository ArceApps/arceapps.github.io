export type BlogLocale = 'en' | 'es';

export type BlogLinkResolution =
  | { status: 'resolved'; slug: string }
  | { status: 'missing'; slug: string };

interface ResolveBlogSlugOptions {
  slug: string;
  locale: BlogLocale;
  availableSlugs: ReadonlySet<string>;
  redirects: Readonly<Record<string, string>>;
}

export function normalizeBlogSlug(slug: string): string {
  return slug.replace(/\/+$/, '');
}

export function parseBlogRedirects(configSource: string): Record<string, string> {
  const redirects: Record<string, string> = {};
  const redirectPattern = /['"]((?:\/es)?\/blog\/[^'"]+)['"]\s*:\s*['"]((?:\/es)?\/blog\/[^'"]+)['"]/g;
  let match: RegExpExecArray | null;

  while ((match = redirectPattern.exec(configSource)) !== null) {
    redirects[match[1]] = match[2];
  }

  return redirects;
}

function routeFor(locale: BlogLocale, slug: string): string {
  return `${locale === 'es' ? '/es' : ''}/blog/${slug}`;
}

function slugFromRoute(route: string): string | null {
  const match = route.match(/\/blog\/([^/]+)\/?$/);
  return match?.[1] ?? null;
}

export function resolveBlogSlug({
  slug,
  locale,
  availableSlugs,
  redirects,
}: ResolveBlogSlugOptions): BlogLinkResolution {
  const normalizedSlug = normalizeBlogSlug(slug);
  const sourceRoute = routeFor(locale, normalizedSlug);
  const canonicalRoute = redirects[sourceRoute] ?? sourceRoute;
  const canonicalSlug = slugFromRoute(canonicalRoute) ?? normalizedSlug;

  if (availableSlugs.has(canonicalSlug)) {
    return { status: 'resolved', slug: canonicalSlug };
  }

  return { status: 'missing', slug: canonicalSlug };
}
