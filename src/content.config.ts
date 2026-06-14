import { defineCollection, z } from 'astro:content';

const status = z.enum(['draft', 'published', 'placeholder']).default('draft');

const travel = defineCollection({
  type: 'content',
  schema: z.object({
    id: z.string(),
    type: z.literal('travel').default('travel'),
    title: z.string(),
    date: z.string(),
    location: z.string(),
    thumbnail: z.string(),
    music: z.string().optional(),
    musicTitle: z.string().optional(),
    status,
    legacyUrls: z.array(z.string()).default([])
  })
});

const photography = defineCollection({
  type: 'content',
  schema: z.object({
    id: z.string(),
    type: z.literal('photography').default('photography'),
    title: z.string(),
    date: z.string(),
    location: z.string(),
    thumbnail: z.string(),
    camera: z.string().optional(),
    darkText: z.boolean().default(false),
    status,
    legacyUrls: z.array(z.string()).default([])
  })
});

export const collections = { travel, photography };
