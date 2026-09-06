import type { SymbolDocumentation } from "./Model.js";
import { resolveMarkdownLinks } from "./MarkdownLinks.js";

const renderExample = (language: string, code: string): string => {
  const normalized = code.trim();
  return /^```/mu.test(normalized) ? normalized : `\`\`\`${language}\n${normalized}\n\`\`\``;
};

export const validateMarkdownFences = (markdown: string): ReadonlyArray<string> => {
  const errors: Array<string> = [];
  let fence: { readonly marker: "```" | "~~~"; readonly line: number } | undefined;
  for (const [index, line] of markdown.split("\n").entries()) {
    const match = /^\s*(```|~~~)/u.exec(line);
    if (match === null) continue;
    const marker = match[1] as "```" | "~~~";
    if (fence === undefined) fence = { marker, line: index + 1 };
    else if (marker === fence.marker) {
      if (line.slice(match[0].length).trim() !== "") {
        errors.push(`Nested ${marker} fence at line ${index + 1}`);
      } else {
        fence = undefined;
      }
    }
  }
  if (fence !== undefined)
    errors.push(`Unclosed ${fence.marker} fence opened at line ${fence.line}`);
  return errors;
};

export const renderSymbolBodyMarkdown = (symbol: SymbolDocumentation): string => {
  const sections = Object.entries(symbol.sections)
    .map(([heading, body]) => `## ${heading}\n\n${body}`)
    .join("\n\n");
  const signatures = symbol.signatures
    .map((signature) => `\`\`\`ts\n${signature}\n\`\`\``)
    .join("\n\n");
  const examples = symbol.examples
    .map((example) => renderExample(example.language, example.code))
    .join("\n\n");
  return `## Signatures\n\n${signatures}\n\n${sections}${examples ? `\n\n## Examples\n\n${examples}` : ""}\n`;
};

export const renderSymbolMarkdown = (symbol: SymbolDocumentation): string =>
  resolveMarkdownLinks(
    `# ${symbol.exportName}\n\n${symbol.summary}\n\n${renderSymbolBodyMarkdown(symbol)}`,
  );
