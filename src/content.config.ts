import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const texts = defineCollection({
  loader: glob({ base: "./src/content/texts", pattern: "**/*.md" }),
  schema: z.object({
    title: z.string(),
    session: z.number().int().positive(),
    order: z.number().int(),
  }),
});

export const collections = { texts };
