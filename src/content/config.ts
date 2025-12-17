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

export const collections = {
  'blog': blogCollection,
};
