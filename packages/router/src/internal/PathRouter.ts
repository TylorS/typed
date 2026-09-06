import type { PathAst } from "../AST.js";

type Entry<A> = {
  readonly expression: RegExp;
  readonly captures: ReadonlyArray<readonly [group: string, name: string]>;
  readonly handler: A;
  readonly order: number;
  readonly score: ReadonlyArray<number>;
};

export interface PathRouterResult<A> {
  readonly handler: A;
  readonly params: Record<string, string>;
  readonly searchParams: Record<string, string | Array<string>>;
}

export interface PathRouter<A> {
  readonly on: (parts: ReadonlyArray<PathAst>, handler: A) => void;
  readonly find: (path: string) => PathRouterResult<A> | undefined;
}

export const makePathRouter = <A>(): PathRouter<A> => {
  const entries: Array<Entry<A>> = [];

  return {
    on(parts, handler) {
      entries.push(compile(parts, handler, entries.length));
      entries.sort(compareEntries);
    },
    find(path) {
      const query = path.indexOf("?");
      const pathname = query < 0 ? path : path.slice(0, query);
      for (const entry of entries) {
        const match = entry.expression.exec(pathname);
        if (match === null) continue;

        const params: Record<string, string> = {};
        for (const [group, name] of entry.captures) {
          params[name] = decodePathParameter(match.groups?.[group] ?? "");
        }

        return {
          handler: entry.handler,
          params,
          searchParams: parseSearchParams(query < 0 ? "" : path.slice(query + 1)),
        };
      }
      return undefined;
    },
  };
};

const compile = <A>(parts: ReadonlyArray<PathAst>, handler: A, order: number): Entry<A> => {
  const normalized = normalize(parts);
  const captures: Array<readonly [group: string, name: string]> = [];
  const score: Array<number> = [];
  let source = "^";

  if (normalized[0]?.type !== "slash") source += "/";

  for (let index = 0; index < normalized.length; index++) {
    const part = normalized[index];
    switch (part.type) {
      case "literal":
        source += escapeRegExp(part.value);
        score.push(3);
        break;
      case "parameter":
        source += capture(captures, part.name, part.regex ?? "[^/]+");
        score.push(part.regex === undefined ? 1 : 2);
        break;
      case "slash":
        source += "/";
        break;
      case "wildcard":
        if (normalized.slice(index + 1).some((next) => next.type !== "query-params")) {
          throw new TypeError("A wildcard must be the final path segment");
        }
        source += capture(captures, "*", ".*");
        score.push(0);
        break;
      case "query-params":
        break;
    }
  }

  if (source.endsWith("/") && source !== "^/") source = source.slice(0, -1);

  return {
    expression: new RegExp(`${source}/?$`, "i"),
    captures,
    handler,
    order,
    score,
  };
};

const capture = (
  captures: Array<readonly [group: string, name: string]>,
  name: string,
  expression: string,
): string => {
  const group = `typed${captures.length}`;
  captures.push([group, name]);
  return `(?<${group}>${expression})`;
};

const decodePathParameter = (value: string): string => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

const parseSearchParams = (query: string): Record<string, string | Array<string>> => {
  const result: Record<string, string | Array<string>> = {};
  for (const [key, value] of new URLSearchParams(query)) {
    const current = result[key];
    if (current === undefined) result[key] = value;
    else if (typeof current === "string") result[key] = [current, value];
    else current.push(value);
  }
  return result;
};

const normalize = (parts: ReadonlyArray<PathAst>): ReadonlyArray<PathAst> => {
  const normalized: Array<PathAst> = [];
  for (const part of parts) {
    if (part.type === "query-params") continue;
    if (part.type === "slash" && normalized.at(-1)?.type === "slash") continue;
    normalized.push(part);
  }
  return normalized;
};

const compareEntries = <A>(left: Entry<A>, right: Entry<A>): number => {
  const length = Math.max(left.score.length, right.score.length);
  for (let index = 0; index < length; index++) {
    const difference = (right.score[index] ?? -1) - (left.score[index] ?? -1);
    if (difference !== 0) return difference;
  }
  return left.order - right.order;
};

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
