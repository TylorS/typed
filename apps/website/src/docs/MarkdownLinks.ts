import { canonicalReferencePath } from "./Reference.js";

/** Rewrite prose links while preserving runnable fenced examples verbatim. */
export const resolveMarkdownLinks = (
  markdown: string,
  resolve: (path: string) => string = canonicalReferencePath,
): string => {
  let fence: string | undefined;
  return markdown
    .split("\n")
    .map((line) => {
      const marker = /^ {0,3}(`{3,}|~{3,})/u.exec(line)?.[1];
      if (marker !== undefined) {
        if (fence === undefined) fence = marker;
        else if (marker[0] === fence[0] && marker.length >= fence.length) fence = undefined;
        return line;
      }
      if (fence !== undefined) return line;
      return line
        .replace(/\]\((\/(?!\/)[^\s)]*)/gu, (_match, path: string) => `](${resolve(path)}`)
        .replace(
          /^(\s*\[[^\]]+\]:\s*)(\/(?!\/)\S+)/u,
          (_match, prefix: string, path: string) => `${prefix}${resolve(path)}`,
        );
    })
    .join("\n");
};
