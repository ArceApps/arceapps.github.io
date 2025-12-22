import { defineCollection, z } from 'astro:content';

const blogCollection = defineCollection({
  schema: z.object({
    title: z.string(),
    description: z.string(),
    // Transform string date to Date object
    pubDate: z.string().transform((str) => new Date(str)),
    heroImage: z.string().optional(),
    tags: z.array(z.string()).optional(),
  }),
});

const appsCollection = defineCollection({
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.string().transform((str) => new Date(str)),
    heroImage: z.string().optional(),
    icon: z.string().optional().default('android'),
    realIconUrl: z.string().optional(),
    screenshots: z.array(z.string()).optional(),
    rating: z.number().optional(),
    version: z.string().optional(),
    lastUpdated: z.string().optional(),
    tags: z.array(z.string()).optional(),
    repoUrl: z.string().optional(),
    demoUrl: z.string().optional(),
    googlePlayUrl: z.string().optional(),
  }),
});

export const collections = {
  'blog': blogCollection,
  'apps': appsCollection,
};
