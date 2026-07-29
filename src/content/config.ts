import { defineCollection, z } from 'astro:content';

const blogCollection = defineCollection({
  schema: z.object({
    title: z.string().max(100),
    description: z.string().min(80).max(300),
    pubDate: z.coerce.date(),
    lastmod: z.coerce.date(),
    author: z.string().default('ArceApps'),
    keywords: z.array(z.string()).min(3).max(8),
    canonical: z.string().url().optional(),
    heroImage: z.string().optional(),
    tags: z.array(z.string()).optional(),
    draft: z.boolean().optional().default(false),
    reference_id: z.string().optional(),
    category: z.string().optional(),
  }),
});

const appsCollection = defineCollection({
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    heroImage: z.string().optional(),
    draft: z.boolean().optional().default(false),
    icon: z.string().optional().default('android'),
    realIconUrl: z.string().url().regex(/^https?:\/\//, 'Must start with http:// or https://').optional(),
    screenshots: z.array(z.string()).optional(),
    rating: z.number().optional(),
    version: z.string().optional(),
    lastUpdated: z.string().optional(),
    tags: z.array(z.string()).optional(),
    repoUrl: z.string().url().regex(/^https?:\/\//, 'Must start with http:// or https://').optional(),
    demoUrl: z.string().url().regex(/^https?:\/\//, 'Must start with http:// or https://').optional(),
    googlePlayUrl: z.string().url().regex(/^https?:\/\//, 'Must start with http:// or https://').optional(),
    reference_id: z.string().optional(),
  }),
});

const projectsCollection = defineCollection({
  schema: z.object({
    title: z.string(), description: z.string(), pubDate: z.coerce.date(),
    datePrecision: z.enum(['exact', 'approximate']).default('exact'),
    heroImage: z.string(), heroImageAlt: z.string(), repositoryUrl: z.string().url(),
    reference_id: z.string(), technologies: z.array(z.string()), tags: z.array(z.string()),
    status: z.enum(['active', 'maintained', 'archived', 'experimental']).default('active'),
    draft: z.boolean().optional().default(false),
  }),
});

const devlogCollection = defineCollection({
  schema: z.object({
    title: z.string().max(100),
    description: z.string().min(80).max(300),
    pubDate: z.coerce.date(),
    lastmod: z.coerce.date(),
    author: z.string().default('ArceApps'),
    keywords: z.array(z.string()).min(3).max(5),
    canonical: z.string().url().optional(),
    heroImage: z.string().optional(),
    tags: z.array(z.string()).optional(),
    draft: z.boolean().optional().default(false),
  }),
});

export const collections = {
  'blog': blogCollection,
  'apps': appsCollection,
  'projects': projectsCollection,
  'devlog': devlogCollection,
};
