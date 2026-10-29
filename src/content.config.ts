import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const sessions = defineCollection({
  loader: glob({ base: "./src/content/sessions", pattern: "**/*.md" }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      session: z.number().int().positive(),
      order: z.number().int(),
      picture: image().optional(),
    }),
});

const lore = defineCollection({
  loader: glob({ base: "./src/content/lore", pattern: "**/*.md" }),
  schema: z.object({
    title: z.string(),
  }),
});

export const collections = { sessions, lore };
