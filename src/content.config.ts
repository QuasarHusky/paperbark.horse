import { file } from "astro/loaders";
import { z } from "astro/zod";
import { defineCollection } from "astro:content";

const tagline = defineCollection({
    loader: file("./src/data/taglines.json"),
    schema: z.object({
        type: z.enum(["text", "quote", "song"]),
        text: z.string(),
        href: z.string().nullish(),
        force: z.boolean().default(false),
        comment: z.string().nullish(),
    }),
});

export const collections = { tagline };
