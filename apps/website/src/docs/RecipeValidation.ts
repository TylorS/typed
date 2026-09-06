export interface RecipeDocumentation {
  readonly slug: string;
  readonly title: string;
  readonly summary: string;
  readonly body: string;
  readonly headings: ReadonlyArray<string>;
}

export interface AuthoredExampleDocumentation {
  readonly slug: string;
  readonly body: string;
}

export interface TypeScriptFenceDocument {
  readonly code: string;
  readonly extension: "ts" | "tsx";
  readonly fileName?: string;
}

export const extractTypeScriptFenceDocuments = (
  markdown: string,
): ReadonlyArray<TypeScriptFenceDocument> =>
  Array.from(
    markdown.matchAll(
      /^```(ts|tsx|typescript|typescriptreact)(?:[ \t]+file="([^"]+)")?[ \t]*\r?\n([\s\S]*?)^```\s*$/gmu,
    ),
    ([, language, fileName, code]) => {
      if (fileName && !/^(?:[A-Za-z0-9_-]+\/)*[A-Za-z0-9_.-]+\.(?:ts|tsx)$/u.test(fileName)) {
        throw new Error(`Invalid example file name: ${fileName}`);
      }
      return {
        code: code!.trim(),
        extension: language === "tsx" || language === "typescriptreact" ? "tsx" : "ts",
        ...(fileName ? { fileName } : {}),
      };
    },
  );

export const extractTypeScriptFences = (markdown: string): ReadonlyArray<string> =>
  extractTypeScriptFenceDocuments(markdown).map(({ code }) => code);

export const validateAuthoredExampleQuality = (
  documents: ReadonlyArray<AuthoredExampleDocumentation>,
): ReadonlyArray<string> => {
  const errors: Array<string> = [];
  for (const document of documents) {
    for (const [index, code] of extractTypeScriptFences(document.body).entries()) {
      if (/^(?:export\s+)?declare\s+/mu.test(code)) {
        errors.push(`${document.slug} example ${index + 1} contains an ambient declaration`);
      }
      if (/^void\s+[A-Za-z_$][\w$]*\s*;?\s*$/mu.test(code)) {
        errors.push(`${document.slug} example ${index + 1} contains a no-op void expression`);
      }
      if (/\bFx\.fromEffect\s*\(\s*Effect\.sync\s*\(/u.test(code)) {
        errors.push(
          `${document.slug} example ${index + 1} wraps Effect.sync with Fx.fromEffect; use Fx.sync`,
        );
      }
    }
  }
  return errors;
};

/**
 * Performs cheap, deterministic checks shared by tests and generation before the TypeScript
 * compiler performs the full semantic check in the docs generator.
 */
export const validateRecipeExamples = (
  documents: ReadonlyArray<RecipeDocumentation>,
): ReadonlyArray<string> => {
  const errors: Array<string> = [];
  for (const document of documents) {
    const fences = extractTypeScriptFences(document.body);
    if (fences.length === 0) errors.push(`${document.slug} has no TypeScript example`);
    if (!fences.some((code) => /from\s+["'](?:@typed|effect)/u.test(code))) {
      errors.push(`${document.slug} has no public Effect/Typed import`);
    }
  }
  return [...errors, ...validateAuthoredExampleQuality(documents)];
};
