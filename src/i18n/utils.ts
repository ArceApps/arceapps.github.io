import { ui, defaultLang } from './ui';

export function getLangFromUrl(url: URL) {
  const [, lang] = url.pathname.split('/');
  if (lang in ui) return lang as keyof typeof ui;
  return defaultLang;
}

export function useTranslations(lang: keyof typeof ui) {
  return function t(key: keyof typeof ui[typeof defaultLang]) {
    return ui[lang][key] || ui[defaultLang][key];
  }
}

export function getRouteFromUrl(url: URL): string | undefined {
  const pathname = url.pathname;
  const parts = pathname.split('/');
  const lang = parts[1];

  if (lang && Object.prototype.hasOwnProperty.call(ui, lang)) {
    return '/' + parts.slice(2).join('/');
  }
  return pathname;
}

/**
 * Normalizes a path by removing the trailing slash, except for the root path.
 */
export function normalizePath(path: string) {
  return path.replace(/\/$/, "") || "/";
}

/**
 * Determines if a path is active based on the current path.
 */
export function isPathActive(currentPath: string, targetPath: string) {
  const normalizedCurrent = normalizePath(currentPath);
  const normalizedTarget = normalizePath(targetPath);

  if (normalizedTarget === "/" || normalizedTarget === "/es") {
    return normalizedCurrent === normalizedTarget;
  }
  return normalizedCurrent.startsWith(normalizedTarget);
}

/**
 * Returns the path for the language toggle.
 */
export function getLocalizedTogglePath(url: URL, currentLang: string): string {
  const segments = url.pathname.split('/').filter(Boolean);
  if (currentLang === 'es' && segments[0] === 'es') {
    segments.shift();
  } else if (currentLang === 'en') {
    segments.unshift('es');
  }
  return '/' + segments.join('/');
}
