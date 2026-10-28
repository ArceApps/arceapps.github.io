import type { CollectionEntry } from 'astro:content';

export type BlogTopic = 'ai' | 'android' | 'engineering' | 'tools' | 'other';

export const blogTopics: { slug: BlogTopic; es: string; en: string }[] = [
  { slug: 'ai', es: 'Inteligencia artificial', en: 'Artificial intelligence' },
  { slug: 'android', es: 'Android y Kotlin', en: 'Android & Kotlin' },
  { slug: 'engineering', es: 'Arquitectura y desarrollo', en: 'Architecture & development' },
  { slug: 'tools', es: 'Herramientas y DevOps', en: 'Tools & DevOps' },
  { slug: 'other', es: 'Otros temas', en: 'Other topics' },
];

/** Shared categorization for every published post, including legacy entries without a category. */
export function topicOf(post: CollectionEntry<'blog'>): BlogTopic {
  const category = (post.data.category || '').toLowerCase();
  const tags = (post.data.tags || []).join(' ').toLowerCase();
  if (/android|kotlin|compose|mobile|room/.test(category)) return 'android';
  if (/ai|agent|llm|prompt|model|memory/.test(category) && !(/memory/.test(category) && /android|kotlin|room/.test(tags))) return 'ai';
  if (/cicd|ci-cd|devops|testing|tools|automation/.test(category)) return 'tools';
  if (/architect|engineering|software|sdd|method|design/.test(category)) return 'engineering';
  if (/android|kotlin|compose|room|jetpack/.test(tags)) return 'android';
  if (/agentes|agents|inteligencia artificial|artificial intelligence|\bia\b|\bai\b|llm|codex|claude|gemini/.test(tags)) return 'ai';
  if (/devops|testing|ci\/cd|github actions|automatizaci[oó]n/.test(tags)) return 'tools';
  if (/arquitectura|architecture|design|engineering|methodology/.test(tags)) return 'engineering';
  return 'other';
}
