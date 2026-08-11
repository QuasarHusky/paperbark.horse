import { file, glob } from "astro/loaders";
import { z } from "astro/zod";
import { defineCollection } from "astro:content";

const tagline = defineCollection({
    loader: file("./src/content/taglines.json"),
    schema: z.object({
        type: z.enum(["text", "quote", "song"]),
        text: z.string(),
        href: z.string().nullish(),
        force: z.boolean().default(false),
        comment: z.string().nullish(),
    }),
});

const post = defineCollection({
    loader: glob({ base: "./src/content/posts", pattern: "**/*.mdoc" }),
    schema: z.object({
        title: z.string(),
        slug: z.string(),

        published: z.coerce.date(),
        updated: z.coerce.date().optional(),

        tags: z.array(z.string()).default([]),
        summary: z.array(z.string()).optional(),
        image: z.string().optional(),

        unlisted: z.boolean().default(false),
        showcase: z.boolean().default(true),

        url: z.string().optional(),
        action: z.string().optional(),

        reactions: z.object({ iid: z.string() }).optional(),
    }),
});

const tag = defineCollection({
    loader: file("./src/content/tags.json"),
    schema: z.object({
        name: z.string(),
        infers: z.array(z.string()).default([]),
    }),
});

export const collections = { tagline, post, tag };
