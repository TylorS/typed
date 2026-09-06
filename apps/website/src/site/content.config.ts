import { defineCollection } from "astro:content";
import { z } from "astro/zod";
import { glob } from "astro/loaders";

const guides = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./content/guides" }),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    section: z.string(),
    kind: z.enum(["concept", "guide", "deep-dive"]),
    order: z.number(),
  }),
});

const recipes = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./content/recipes" }),
  schema: z.object({ slug: z.string(), title: z.string(), summary: z.string() }),
});

const learn = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./content/learn" }),
  schema: z.object({
    id: z.string(),
    title: z.string(),
    summary: z.string(),
    order: z.number(),
    demo: z.string().optional(),
  }),
});
const tutorial = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./content/tutorial" }),
  schema: z.object({
    slug: z.string(),
    title: z.string(),
    summary: z.string(),
    order: z.number(),
    demo: z.string().optional(),
    architecture: z.array(z.string()),
  }),
});

export const collections = { guides, recipes, learn, tutorial };
