import { Schema } from "effect";
import * as fs from "node:fs";
import * as path from "node:path";
import type { GlossaryEntry, GuideDocumentation } from "./Model.js";
import type { RecipeDocumentation } from "./Recipes.js";

export interface ParsedFrontmatter {
  readonly attributes: Record<string, unknown>;
  readonly body: string;
}

const splitArray = (value: string): Array<string> => {
  const content = value.slice(1, -1).trim();
  if (content === "") return [];
  const parts: Array<string> = [];
  let current = "";
  let quote: "'" | '"' | undefined;
  for (const character of content) {
    if (quote !== undefined) {
      current += character;
      if (character === quote) quote = undefined;
    } else if (character === "'" || character === '"') {
      quote = character;
      current += character;
    } else if (character === ",") {
      parts.push(current.trim());
      current = "";
    } else {
      current += character;
    }
  }
  parts.push(current.trim());
  return parts.map((part) => parseValue(part) as string);
};

const parseValue = (value: string): unknown => {
  const trimmed = value.trim();
  if (trimmed.startsWith("[") && trimmed.endsWith("]")) return splitArray(trimmed);
  if (trimmed === "true") return true;
  if (trimmed === "false") return false;
  if (trimmed === "null") return null;
  if (/^-?(?:0|[1-9]\d*)(?:\.\d+)?$/u.test(trimmed)) return Number(trimmed);
  if (trimmed.length >= 2 && trimmed.startsWith('"') && trimmed.endsWith('"')) {
    return JSON.parse(trimmed);
  }
  if (trimmed.length >= 2 && trimmed.startsWith("'") && trimmed.endsWith("'")) {
    return trimmed.slice(1, -1).replaceAll("''", "'");
  }
  return trimmed;
};

const rejectUnknownAttributes = (
  fileName: string,
  attributes: Record<string, unknown>,
  allowed: ReadonlySet<string>,
): void => {
  for (const key of Object.keys(attributes)) {
    if (!allowed.has(key)) throw new Error(`Unknown frontmatter attribute in ${fileName}: ${key}`);
  }
};

/** Parses the deliberately small, deterministic YAML subset used by authored site content. */
export const parseFrontmatter = (fileName: string, source: string): ParsedFrontmatter => {
  const match = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)([\s\S]*)$/u.exec(source);
  if (match === null) throw new Error(`${fileName} must begin with YAML-style frontmatter`);
  const attributes: Record<string, unknown> = {};
  for (const line of match[1]!.split(/\r?\n/u)) {
    if (line.trim() === "" || line.trimStart().startsWith("#")) continue;
    const separator = line.indexOf(":");
    if (separator < 1) throw new Error(`Invalid frontmatter in ${fileName}: ${line}`);
    const key = line.slice(0, separator).trim();
    if (key in attributes) throw new Error(`Duplicate frontmatter key in ${fileName}: ${key}`);
    attributes[key] = parseValue(line.slice(separator + 1));
  }
  return { attributes, body: match[2]!.trim() };
};

const GlossaryFrontmatterSchema = Schema.Struct({
  id: Schema.String,
  term: Schema.String,
  definition: Schema.String,
  aliases: Schema.optionalKey(Schema.Array(Schema.String)),
  related: Schema.optionalKey(Schema.Array(Schema.String)),
  links: Schema.optionalKey(Schema.Array(Schema.String)),
});

export const parseGlossaryEntry = (fileName: string, source: string): GlossaryEntry => {
  const parsed = parseFrontmatter(fileName, source);
  rejectUnknownAttributes(
    fileName,
    parsed.attributes,
    new Set(["id", "term", "definition", "aliases", "related", "links"]),
  );
  const frontmatter = Schema.decodeUnknownSync(GlossaryFrontmatterSchema)(parsed.attributes);
  const entry = {
    id: frontmatter.id,
    term: frontmatter.term,
    aliases: frontmatter.aliases ?? [],
    definition: frontmatter.definition,
    details: parsed.body,
    related: frontmatter.related ?? [],
    links: frontmatter.links ?? [],
  } satisfies GlossaryEntry;
  for (const link of entry.links) {
    try {
      new URL(link);
    } catch {
      throw new Error(`Invalid glossary link in ${fileName}: ${link}`);
    }
  }
  return entry;
};

export const loadGlossaryContent = (directory: string): ReadonlyArray<GlossaryEntry> => {
  const files = fs
    .readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
    .map((entry) => entry.name)
    .sort();
  const entries = files.map((fileName) =>
    parseGlossaryEntry(fileName, fs.readFileSync(path.join(directory, fileName), "utf8")),
  );
  const ids = new Set<string>();
  for (const entry of entries) {
    if (ids.has(entry.id)) throw new Error(`Duplicate glossary id: ${entry.id}`);
    ids.add(entry.id);
  }
  const aliases = new Set<string>();
  for (const entry of entries) {
    for (const alias of entry.aliases) {
      if (ids.has(alias) || aliases.has(alias))
        throw new Error(`Duplicate glossary alias: ${alias}`);
      aliases.add(alias);
    }
  }
  for (const entry of entries) {
    for (const related of entry.related) {
      if (!ids.has(related))
        throw new Error(`${entry.id} refers to missing glossary term: ${related}`);
    }
  }
  return entries;
};

const GuideFrontmatterSchema = Schema.Struct({
  title: Schema.String,
  summary: Schema.String,
  section: Schema.String,
  kind: Schema.Literals(["concept", "guide", "deep-dive"]),
  order: Schema.Number,
});

export const parseGuideDocumentation = (fileName: string, source: string): GuideDocumentation => {
  const parsed = parseFrontmatter(fileName, source);
  rejectUnknownAttributes(
    fileName,
    parsed.attributes,
    new Set(["title", "summary", "section", "kind", "order"]),
  );
  const frontmatter = Schema.decodeUnknownSync(GuideFrontmatterSchema)(parsed.attributes);
  return {
    slug: fileName.replace(/\.md$/u, ""),
    title: frontmatter.title,
    summary: frontmatter.summary,
    section: frontmatter.section,
    kind: frontmatter.kind,
    order: frontmatter.order,
    headings: Array.from(parsed.body.matchAll(/^##\s+(.+)$/gmu), ([, heading]) => heading!.trim()),
    body: parsed.body,
    relations: [],
  };
};

const RecipeFrontmatterSchema = Schema.Struct({
  slug: Schema.String,
  title: Schema.String,
  summary: Schema.String,
});

export const parseRecipeDocumentation = (fileName: string, source: string): RecipeDocumentation => {
  const parsed = parseFrontmatter(fileName, source);
  rejectUnknownAttributes(fileName, parsed.attributes, new Set(["slug", "title", "summary"]));
  const frontmatter = Schema.decodeUnknownSync(RecipeFrontmatterSchema)(parsed.attributes);
  return {
    slug: frontmatter.slug,
    title: frontmatter.title,
    summary: frontmatter.summary,
    headings: Array.from(parsed.body.matchAll(/^##\s+(.+)$/gmu), ([, heading]) => heading!.trim()),
    body: parsed.body,
  };
};

export const loadRecipeContent = (directory: string): ReadonlyArray<RecipeDocumentation> => {
  const files = fs
    .readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
    .map((entry) => entry.name)
    .sort();
  const recipes = files.map((fileName) =>
    parseRecipeDocumentation(fileName, fs.readFileSync(path.join(directory, fileName), "utf8")),
  );
  const slugs = new Set<string>();
  for (const recipe of recipes) {
    if (slugs.has(recipe.slug)) throw new Error(`Duplicate recipe slug: ${recipe.slug}`);
    slugs.add(recipe.slug);
  }
  return recipes;
};
