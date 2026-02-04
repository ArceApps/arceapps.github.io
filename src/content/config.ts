import { defineCollection, z } from 'astro:content';

const blogCollection = defineCollection({
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    heroImage: z.string().optional(),
    tags: z.array(z.string()).optional(),
    draft: z.boolean().optional().default(false),
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
    realIconUrl: z.string().url().regex(/^https?:\/\//, { message: "URL must start with http:// or https://" }).optional(),
    screenshots: z.array(z.string()).optional(),
    rating: z.number().optional(),
    version: z.string().optional(),
    lastUpdated: z.string().optional(),
    tags: z.array(z.string()).optional(),
    repoUrl: z.string().url().regex(/^https?:\/\//, { message: "URL must start with http:// or https://" }).optional(),
    demoUrl: z.string().url().regex(/^https?:\/\//, { message: "URL must start with http:// or https://" }).optional(),
    googlePlayUrl: z.string().url().regex(/^https?:\/\//, { message: "URL must start with http:// or https://" }).optional(),
  }),
});

const devlogCollection = defineCollection({
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    heroImage: z.string().optional(),
    tags: z.array(z.string()).optional(),
    draft: z.boolean().optional().default(false),
  }),
});

export const collections = {
  'blog': blogCollection,
  'apps': appsCollection,
  'devlog': devlogCollection,
};
