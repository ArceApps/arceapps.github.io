import type { CollectionEntry } from 'astro:content';

export type BlogTopic = 'android' | 'ai' | 'architecture' | 'testing' | 'engineering' | 'tools' | 'other';

export const blogTopics: { slug: BlogTopic; es: string; en: string }[] = [
  { slug: 'android', es: 'Android', en: 'Android' },
  { slug: 'ai', es: 'IA', en: 'AI' },
  { slug: 'architecture', es: 'Arquitectura', en: 'Architecture' },
  { slug: 'testing', es: 'Testing', en: 'Testing' },
];

/** Shared categorization for every published post, including legacy entries without a category. */
export function topicOf(post: CollectionEntry<'blog'>): BlogTopic {
  const category = (post.data.category || '').toLowerCase();
  const tags = (post.data.tags || []).join(' ').toLowerCase();
  const title = (post.data.title || '').toLowerCase();
  const combined = `${category} ${tags} ${title}`;

  if (/test|testing|tdd|unit test|instrument|benchmark|coverage/.test(combined)) return 'testing';
  if (/android|kotlin|compose|room|mobile|jetpack/.test(combined)) return 'android';
  if (/ai|agent|llm|deepseek|model|prompt|memory|claude|gemini|\bia\b|\bai\b/.test(combined)) return 'ai';
  if (/architect|arquitectura|sdd|clean arch|mvvm|repository|solid|design pattern|engineering/.test(combined)) return 'architecture';
  if (/android|kotlin/.test(tags)) return 'android';
  return 'architecture';
}
