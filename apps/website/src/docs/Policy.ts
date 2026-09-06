import ts from "typescript-compiler";
import type { DocumentationModel } from "./Model.js";

const scriptLanguage = /^(?:ts|tsx|typescript|js|jsx|javascript)$/iu;

const hasPublicImport = (code: string): boolean => {
  const source = ts.createSourceFile("example.tsx", code, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  return source.statements.some((statement) => {
    if (!ts.isImportDeclaration(statement) || !ts.isStringLiteral(statement.moduleSpecifier)) return false;
    const specifier = statement.moduleSpecifier.text;
    return /^@typed\/[^/]+(?:\/[^/]+)*$/u.test(specifier)
      && !/(?:^|\/)(?:src|dist|internal|__tests__)(?:\/|$)|[*.]|\s/u.test(specifier);
  });
};

export const validateDocumentation = (model: DocumentationModel): ReadonlyArray<string> => {
  const errors: Array<string> = [];
  const targets = new Set([
    ...model.symbols.map(({ id }) => id),
    ...model.guides.map(({ slug }) => `guide:${slug}`),
    ...model.glossary.map(({ id }) => `glossary:${id}`),
  ]);

  for (const symbol of model.symbols) {
    if (!symbol.summary.trim()) errors.push(`${symbol.id} is missing a declaration summary`);
    if (symbol.signatures.length === 0 || symbol.signatures.some((signature) => !signature.trim())) {
      errors.push(`${symbol.id} is missing a declaration signature`);
    }
    for (const example of symbol.examples) {
      if (scriptLanguage.test(example.language) && !hasPublicImport(example.code)) {
        errors.push(`${symbol.id} example must contain an exact public import`);
      }
    }
  }

  for (const entry of [
    ...model.symbols.map(({ id, relations }) => ({ id, relations })),
    ...model.guides.map(({ slug, relations }) => ({ id: `guide:${slug}`, relations })),
  ]) {
    for (const relation of entry.relations) {
      const target =
        relation.kind === "symbol" ? relation.target : `${relation.kind}:${relation.target}`;
      if (!targets.has(target)) errors.push(`${entry.id} has broken relation ${target}`);
    }
  }
  return errors;
};
