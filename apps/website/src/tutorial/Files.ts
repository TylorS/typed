import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/** Remove the surrounding margin, retaining the relative indentation of every line. */
const dedent = (source: string): string => {
  const lines = source.split("\n");
  while (lines[0]?.trim() === "") lines.shift();
  while (lines.at(-1)?.trim() === "") lines.pop();
  const content = lines.filter((line) => line.trim() !== "");
  if (content.length === 0) return "";
  const margin = Math.min(...content.map((line) => line.search(/\S/u)));
  return lines.map((line) => line.slice(margin)).join("\n");
};

/** Resolve a curriculum-owned module without evaluating authored Markdown. */
export const resolveCurriculumSource = (source: string): string => {
  const [reference, ...checks] = source.trim().split("\n");
  const match =
    /^\/\/ @source (examples\/(?:[A-Za-z0-9_-]+\/)*[A-Za-z0-9_.-]+\.[a-z]+)(?:#L([1-9][0-9]*)-L([1-9][0-9]*))?$/u.exec(
      reference!,
    );
  if (!match) {
    if (reference?.startsWith("// @source"))
      throw new Error(`Invalid curriculum source reference: ${reference}`);
    return dedent(source);
  }
  // Astro moves this module into a prerender chunk; source paths remain relative to the site root.
  const fullSource = readFileSync(resolve("src/tutorial", match[1]!), "utf8").trimEnd();
  if (!match[2]) {
    if (checks.length) throw new Error(`Unexpected source checks: ${reference}`);
    return fullSource;
  }
  const lines = fullSource.split("\n");
  const start = Number(match[2]);
  const end = Number(match[3]);
  if (end < start || end > lines.length)
    throw new Error(`Invalid curriculum source range: ${reference}`);
  const excerpt = dedent(lines.slice(start - 1, end).join("\n"));
  if (!checks.length) throw new Error(`Curriculum excerpts need an @expect check: ${reference}`);
  for (const check of checks) {
    const expected = /^\/\/ @expect (.+)$/u.exec(check)?.[1];
    if (!expected || !excerpt.includes(expected))
      throw new Error(`Curriculum excerpt no longer contains ${check}: ${reference}`);
  }
  return excerpt;
};

/** Expand source references for downloadable Markdown as well as rendered code. */
export const expandCurriculumSources = (markdown: string): string =>
  markdown.replace(
    /(^```[^\n]*\n)(\/\/ @source [^\n]+(?:\n\/\/ @expect [^\n]+)*)(\n```)/gmu,
    (_match, start: string, source: string, end: string) =>
      start + resolveCurriculumSource(source) + end,
  );

interface MarkdownNode {
  type?: string;
  value?: string;
  children?: Array<MarkdownNode>;
}

/** Runs before syntax highlighting; previews import these exact source modules. */
export const remarkCurriculumSources = () => (tree: MarkdownNode) => {
  const visit = (node: MarkdownNode) => {
    if (node.type === "code" && node.value) node.value = resolveCurriculumSource(node.value);
    for (const child of node.children ?? []) visit(child);
  };
  visit(tree);
};

export interface CurriculumFile {
  readonly name: string;
  readonly language: "ts" | "json" | "html" | "sh";
  readonly source: string;
}

/** Named snapshots may be interleaved with explanations, decisions and exercises. */
export const parseCurriculumFiles = (fileName: string, markdown: string) => {
  const files: Array<CurriculumFile> = [];
  const body = markdown
    .replaceAll("\r\n", "\n")
    .replace(
      /(?:^|\n)```(ts|json|html|sh) file="([^"]+)"\n([\s\S]*?)\n```(?=\n|$)/gu,
      (_match, language: CurriculumFile["language"], name: string, source: string) => {
        if (files.some((file) => file.name === name)) {
          throw new Error(`Duplicate file snapshot in ${fileName}: ${name}`);
        }
        files.push({ name, language, source: resolveCurriculumSource(source) });
        return "";
      },
    );
  if (files.length === 0) throw new Error(`No named file snapshots in ${fileName}`);
  return { body: body.trim(), files };
};
