/* eslint-disable no-restricted-syntax */
import * as Effect from "effect/Effect";
import { type Pipeable, pipeArguments } from "effect/Pipeable";
import * as Schema from "effect/Schema";
import * as SchemaIssue from "effect/SchemaIssue";
import * as SchemaParser from "effect/SchemaParser";
import * as Transformation from "effect/SchemaTransformation";
import type { Simplify } from "effect/Types";
import * as AST from "./AST.js";
import * as Path from "./Path.js";

/**
 * A pipeable route value containing syntax, normalized path, and Effect Schemas.
 *
 * @remarks
 * ## Why
 * Matching and parameter decoding share one immutable source of truth.
 *
 * ## Ownership and lifetime
 * A Route value retains its AST and memoized derived values until that Route becomes unreachable; it owns no Scope.
 *
 * @since 1.0.0
 * @category Route contracts
 */
export interface Route<
  P extends string,
  S extends Schema.Codec<any, Path.Params<P>, any, any> = Schema.Codec<Path.Params<P>>,
> extends Pipeable {
  /**
   * The immutable Route AST compiled by Matcher.
   *
   * @remarks
   * ## Why
   * Advanced composition can inspect structure without reparsing the formatted path.
   *
   * ## Ownership and lifetime
   * The Route retains its `ast` value for the Route's lifetime. Reading it performs no acquisition; Codec services are required only when a schema is executed.
   *
   * @since 1.0.0
   * @category Route inspection
   */
  readonly ast: AST.RouteAst;
  /**
   * The normalized route string derived from this Route's AST.
   *
   * @remarks
   * ## Why
   * Matcher registration and links use one memoized formatting result.
   *
   * ## Ownership and lifetime
   * The Route retains its `path` value for the Route's lifetime. Reading it performs no acquisition; Codec services are required only when a schema is executed.
   *
   * @since 1.0.0
   * @category Route inspection
   */
  readonly path: P;

  /**
   * The Effect Schema for the route's combined decoded parameters.
   *
   * @remarks
   * ## Why
   * Matcher handlers receive the schema's Type and service/error behavior exactly.
   *
   * ## Ownership and lifetime
   * The Route retains its `paramsSchema` value for the Route's lifetime. Reading it performs no acquisition; Codec services are required only when a schema is executed.
   *
   * @since 1.0.0
   * @category Parameter codecs
   */
  readonly paramsSchema: S;
  /**
   * The Effect Schema for decoded path parameters only.
   *
   * @remarks
   * ## Why
   * Handlers and tools can validate path values independently of query input.
   *
   * ## Ownership and lifetime
   * The Route retains its `pathSchema` value for the Route's lifetime. Reading it performs no acquisition; Codec services are required only when a schema is executed.
   *
   * @since 1.0.0
   * @category Parameter codecs
   */
  readonly pathSchema: Schema.Codec<Path.PathParams<P>>;
  /**
   * The Effect Schema for decoded query parameters only.
   *
   * @remarks
   * ## Why
   * Query parsing policy remains available separately from path decoding.
   *
   * ## Ownership and lifetime
   * The Route retains its `querySchema` value for the Route's lifetime. Reading it performs no acquisition; Codec services are required only when a schema is executed.
   *
   * @since 1.0.0
   * @category Parameter codecs
   */
  readonly querySchema: Schema.Codec<Path.QueryParams<P>>;
}

export declare namespace Route {
  /**
   * A Route with intentionally widened path and schema parameters.
   *
   * @remarks
   * ## Why
   * Heterogeneous route collections can store values while constructor overloads retain precise types.
   *
   * ## Ownership and lifetime
   * TypeScript computes `Any` from its Route input; the alias is erased and owns no runtime value.
   *
   * @since 1.0.0
   * @category Route type inference
   */
  export type Any = Route<any, any>;

  /**
   * Extracts the literal path string type from a Route.
   *
   * @remarks
   * ## Why
   * Higher-level builders can preserve route spelling through generic composition.
   *
   * ## Ownership and lifetime
   * TypeScript computes `Path` from its Route input; the alias is erased and owns no runtime value.
   *
   * @since 1.0.0
   * @category Route type inference
   */
  export type Path<T> = T extends Route<infer P, any> ? P : never;
  /**
   * Extracts the combined parameter Codec from a Route.
   *
   * @remarks
   * ## Why
   * Schema errors and service requirements remain available to generic route utilities.
   *
   * ## Ownership and lifetime
   * TypeScript computes `Schema` from its Route input; the alias is erased and owns no runtime value.
   *
   * @since 1.0.0
   * @category Route type inference
   */
  export type Schema<T> = T extends Route<any, infer S> ? S : never;
  /**
   * Extracts the decoded parameter type from a Route.
   *
   * @remarks
   * ## Why
   * Handlers receive the route schema's exact successful value.
   *
   * ## Ownership and lifetime
   * TypeScript computes `Type` from its Route input; the alias is erased and owns no runtime value.
   *
   * @since 1.0.0
   * @category Route type inference
   */
  export type Type<T> = T extends Route<any, infer S> ? S["Type"] : never;
  /**
   * Combines decoded path and query parameter fields for a route string.
   *
   * @remarks
   * ## Why
   * Matcher handlers receive one exact parameter object derived from the route grammar.
   *
   * ## Ownership and lifetime
   * TypeScript computes `Params` from its Route input; the alias is erased and owns no runtime value.
   *
   * @since 1.0.0
   * @category Route type inference
   */
  export type Params<T> = T extends Route<infer P, infer _S> ? Path.Params<P> : never;
  /**
   * Extracts services required to decode a Route's parameters.
   *
   * @remarks
   * ## Why
   * Matcher requirements include schema dependencies rather than hiding them at runtime.
   *
   * ## Ownership and lifetime
   * TypeScript computes `DecodingServices` from its Route input; the alias is erased and owns no runtime value.
   *
   * @since 1.0.0
   * @category Route type inference
   */
  export type DecodingServices<T> = T extends Route<any, infer S> ? S["DecodingServices"] : never;
  /**
   * Extracts services required to encode a Route's parameters.
   *
   * @remarks
   * ## Why
   * Link builders can preserve schema encoding requirements in their Effect environment.
   *
   * ## Ownership and lifetime
   * TypeScript computes `EncodingServices` from its Route input; the alias is erased and owns no runtime value.
   *
   * @since 1.0.0
   * @category Route type inference
   */
  export type EncodingServices<T> = T extends Route<any, infer S> ? S["EncodingServices"] : never;

  /**
   * Extracts the decoded path-only parameter record from a Route.
   *
   * @remarks
   * ## Why
   * Generic handlers can separate path data from query data.
   *
   * ## Ownership and lifetime
   * TypeScript computes `PathType` from its Route input; the alias is erased and owns no runtime value.
   *
   * @since 1.0.0
   * @category Route type inference
   */
  export type PathType<T extends Any> = T["pathSchema"]["Type"];
  /**
   * Extracts the decoded query-only parameter record from a Route.
   *
   * @remarks
   * ## Why
   * Generic handlers can reason about declared query data independently.
   *
   * ## Ownership and lifetime
   * TypeScript computes `QueryType` from its Route input; the alias is erased and owns no runtime value.
   *
   * @since 1.0.0
   * @category Route type inference
   */
  export type QueryType<T extends Any> = T["querySchema"]["Type"];
}

/**
 * A Route with intentionally widened path and schema parameters.
 *
 * @remarks
 * ## Why
 * Heterogeneous route collections can store values while constructor overloads retain precise types.
 *
 * ## Ownership and lifetime
 * TypeScript computes `Any` from its Route input; the alias is erased and owns no runtime value.
 *
 * @since 1.0.0
 * @category Route type inference
 */
export type Any = Route.Any;
/**
 * Combines decoded path and query parameter fields for a route string.
 *
 * @remarks
 * ## Why
 * Matcher handlers receive one exact parameter object derived from the route grammar.
 *
 * ## Ownership and lifetime
 * TypeScript computes `Params` from its Route input; the alias is erased and owns no runtime value.
 *
 * @since 1.0.0
 * @category Route type inference
 */
export type Params<T> = Route.Params<T>;
/**
 * Extracts the decoded parameter type from a Route.
 *
 * @remarks
 * ## Why
 * Handlers receive the route schema's exact successful value.
 *
 * ## Ownership and lifetime
 * TypeScript computes `Type` from its Route input; the alias is erased and owns no runtime value.
 *
 * @since 1.0.0
 * @category Route type inference
 */
export type Type<T> = Route.Type<T>;
/**
 * Extracts the decoded path-only parameter record from a Route.
 *
 * @remarks
 * ## Why
 * Generic handlers can separate path data from query data.
 *
 * ## Ownership and lifetime
 * TypeScript computes `PathType` from its Route input; the alias is erased and owns no runtime value.
 *
 * @since 1.0.0
 * @category Route type inference
 */
export type PathType<T extends Any> = Route.PathType<T>;
/**
 * Extracts the decoded query-only parameter record from a Route.
 *
 * @remarks
 * ## Why
 * Generic handlers can reason about declared query data independently.
 *
 * ## Ownership and lifetime
 * TypeScript computes `QueryType` from its Route input; the alias is erased and owns no runtime value.
 *
 * @since 1.0.0
 * @category Route type inference
 */
export type QueryType<T extends Any> = Route.QueryType<T>;

/**
 * Constructs a Route from a Route AST and lazily memoizes its path and schemas.
 *
 * @remarks
 * ## Why
 * Advanced builders can preserve the same invariants as built-in route constructors.
 *
 * ## Ownership and lifetime
 * `make` constructs its Route immediately. The Route retains the supplied AST or route values and lazily memoizes derived paths and Codecs; Codec services are required only when decoding or encoding runs.
 *
 * @example
 * ```ts
 * import * as Router from "@typed/router"
 * import { literal, path } from "@typed/router/AST"
 *
 * const Account = Router.make<"/account">(path(literal("account")))
 * ```
 *
 * @since 1.0.0
 * @category Route construction
 */
export function make<
  const P extends string,
  S extends Schema.Codec<any, Path.Params<P>, any, any> = Schema.Codec<Path.Params<P>>,
>(ast: AST.RouteAst): Route<P, S> {
  Path.assertUniqueDecodedRouteParamNames(ast);
  const getParts = once(() => Path.flattenRouteAst(ast));
  const path = once(() => Path.join(getParts()) as P);
  const paramsSchema = once(() => getParamsSchema(ast) as S);
  const pathSchema = once(() => getPathSchema(ast) as Schema.Codec<Path.PathParams<P>>);
  const querySchema = once(() => getQuerySchema(ast) as Schema.Codec<Path.QueryParams<P>>);

  return {
    ast,
    get path() {
      return path();
    },
    get paramsSchema() {
      return paramsSchema();
    },
    get pathSchema() {
      return pathSchema();
    },
    get querySchema() {
      return querySchema();
    },
    pipe() {
      return pipeArguments(this, arguments);
    },
  };
}

function once<T>(fn: () => T): () => T {
  let memoized: [T] | [] = [];
  return (): T => {
    if (memoized.length === 1) {
      return memoized[0];
    }
    const result = fn();
    memoized = [result];
    return result;
  };
}

function getParamsSchema(ast: AST.RouteAst): Schema.Top {
  const parts = Path.flattenRouteAst(ast);
  switch (ast.type) {
    case "path": {
      return makeFlatParamsSchema(parts, true, true);
    }
    case "transform": {
      return getParamsSchema(ast.from).pipe(Schema.decodeTo(ast.to, ast.transformation));
    }
    case "join": {
      const encoded = makeFlatParamsSchema(parts, true, true);
      const childParts = ast.parts.map((part) => ({
        names: new Set(Path.flattenRouteAst(part).flatMap(Path.getDecodedParamNames)),
        schema: getParamsSchema(part),
      }));
      return encoded.pipe(
        Schema.decodeTo(
          Schema.Unknown,
          Transformation.transformOrFail<unknown, unknown, unknown, unknown>({
            decode: (input, options) => {
              return Effect.forEach(childParts, ({ names, schema }) =>
                SchemaParser.decodeEffect(schema)(projectRecord(input, names), options),
              ).pipe(Effect.flatMap((values) => mergeRecords(values, options)));
            },
            encode: (input, options) => {
              const childOptions = { ...options, onExcessProperty: "ignore" as const };
              return Effect.forEach(childParts, ({ names, schema }) =>
                SchemaParser.encodeUnknownEffect(schema)(input, childOptions).pipe(
                  Effect.map((encoded) => projectRecord(encoded, names)),
                ),
              ).pipe(Effect.flatMap((values) => mergeRecords(values, options)));
            },
          }),
        ),
      );
    }
  }
}

function getPathSchema(ast: AST.RouteAst): Schema.Top {
  return makeFlatParamsSchema(Path.flattenRouteAst(ast), true, false);
}

function getQuerySchema(ast: AST.RouteAst): Schema.Top {
  return makeFlatParamsSchema(Path.flattenRouteAst(ast), false, true);
}

function makeFlatParamsSchema(
  parts: ReadonlyArray<AST.PathAst>,
  includePath: boolean,
  includeQuery: boolean,
): Schema.Top {
  const fields = Path.getSchemaFields(parts);
  const requiredFields: Array<[string, Schema.Top]> = includePath ? [...fields.requiredFields] : [];
  const optionalFields: Array<[Schema.Record.Key, Schema.Top]> = includePath
    ? [...fields.optionalFields]
    : [];

  if (includeQuery) {
    for (const [, query] of fields.queryParams) {
      requiredFields.push(...query.requiredFields);
      optionalFields.push(...query.optionalFields);
    }
  }

  return Path.schemaFromFields({ requiredFields, optionalFields });
}

function mergeRecords(
  values: ReadonlyArray<unknown>,
  options: Parameters<typeof SchemaParser.decodeUnknownEffect>[1],
): Effect.Effect<Record<PropertyKey, unknown>, SchemaIssue.Issue> {
  const output: Record<PropertyKey, unknown> = {};
  const keys = new Set<PropertyKey>();
  for (const value of values) {
    if (typeof value === "object" && value !== null) {
      for (const key of Reflect.ownKeys(value)) {
        if (!Object.prototype.propertyIsEnumerable.call(value, key)) continue;
        if (keys.has(key)) {
          return Effect.fail(
            new SchemaIssue.InvalidValue(
              { message: `Duplicate decoded route parameter: ${String(key)}` },
              values,
              options,
            ),
          );
        }
        keys.add(key);
        output[key] = (value as Record<PropertyKey, unknown>)[key];
      }
    }
  }
  return Effect.succeed(output);
}

function projectRecord(input: unknown, names: ReadonlySet<string>): Record<PropertyKey, unknown> {
  const output: Record<PropertyKey, unknown> = {};
  if (typeof input !== "object" || input === null) return output;
  for (const name of names) {
    if (Object.prototype.propertyIsEnumerable.call(input, name)) {
      output[name] = (input as Record<PropertyKey, unknown>)[name];
    }
  }
  return output;
}

/**
 * Parses a route-pattern string into a typed Route.
 *
 * @remarks
 * ## Why
 * It is the primary constructor for literals, named parameters, optional parameters, regular-
 * expression parameters, wildcards, and query declarations. The special `??` boundary separates a
 * terminal optional path parameter from query syntax.
 *
 * ## Ownership and lifetime
 * `Parse` constructs its Route immediately. The Route retains the supplied AST or route values and lazily memoizes derived paths and Codecs; Codec services are required only when decoding or encoding runs.
 *
 * @example
 * ```ts
 * import * as Router from "@typed/router"
 *
 * const User = Router.Parse("/users/:id?tab=:tab?")
 * // Router.Type<typeof User> is { readonly id: string; readonly tab?: string }
 * ```
 *
 * @since 1.0.0
 * @category Route construction
 */
export const Parse = <const P extends string>(path: P): Route<Path.Join<Path.ParseAsts<P>>> => {
  const asts = Path.parse(path) as ReadonlyArray<AST.PathAst>;
  if (asts.length === 0) return Slash as unknown as Route<Path.Join<Path.ParseAsts<P>>>;
  if (asts.length === 1) return make(AST.path(asts[0]));
  return Join<Array<any>>(...asts.map((ast) => make(AST.path(ast)))) as unknown as Route<
    Path.Join<Path.ParseAsts<P>>
  >;
};

/**
 * The root slash Route.
 *
 * @remarks
 * ## Why
 * Root matching remains an explicit route value rather than an empty sentinel.
 *
 * ## Ownership and lifetime
 * `Slash` constructs its Route immediately. The Route retains the supplied AST or route values and lazily memoizes derived paths and Codecs; Codec services are required only when decoding or encoding runs.
 *
 * @since 1.0.0
 * @category Route construction
 */
export const Slash = make<"/">(AST.path(AST.literal("")));

/**
 * A Route that captures an unconstrained remainder.
 *
 * @remarks
 * ## Why
 * Catch-all matching is explicit and can be ordered after constrained routes.
 *
 * ## Ownership and lifetime
 * `Wildcard` constructs its Route immediately. The Route retains the supplied AST or route values and lazily memoizes derived paths and Codecs; Codec services are required only when decoding or encoding runs.
 *
 * @since 1.0.0
 * @category Route construction
 */
export const Wildcard = make<"*">(AST.path(AST.wildcard()));

/**
 * Constructs a named string path-parameter Route.
 *
 * @remarks
 * ## Why
 * Literal parameter names flow into the handler's inferred record type.
 *
 * ## Ownership and lifetime
 * `Param` constructs its Route immediately. The Route retains the supplied AST or route values and lazily memoizes derived paths and Codecs; Codec services are required only when decoding or encoding runs.
 *
 * @since 1.0.0
 * @category Route construction
 */
export const Param = <const P extends string>(paramName: P): Route<`/:${P}`> =>
  make<`/:${P}`>(AST.path(AST.parameter(paramName)));

/**
 * Constructs a named path parameter decoded by an Effect Schema Codec.
 *
 * @remarks
 * ## Why
 * Routes can expose domain values while retaining encoded string matching and schema services.
 *
 * ## Ownership and lifetime
 * `ParamWithSchema` constructs its Route immediately. The Route retains the supplied AST or route values and lazily memoizes derived paths and Codecs; Codec services are required only when decoding or encoding runs.
 *
 * @since 1.0.0
 * @category Parameter codecs
 */
export const ParamWithSchema = <
  const P extends string,
  S extends Schema.Codec<any, string, any, any> = Schema.Codec<string>,
>(
  paramName: P,
  schema: S,
): Route<
  `/:${P}`,
  Schema.Codec<
    { readonly [K in P]: S["Type"] },
    Path.Params<`/:${P}`>,
    S["DecodingServices"],
    S["EncodingServices"]
  >
> => {
  const paramsSchema = Schema.Struct({ [paramName]: schema });
  return make(
    AST.transform(AST.path(AST.parameter(paramName)), paramsSchema, Transformation.passthrough()),
  );
};

/**
 * Constructs a finite-number path parameter decoded from a string.
 *
 * @remarks
 * ## Why
 * Numeric conversion failures stay in route decoding instead of reaching the handler as bad data.
 *
 * ## Ownership and lifetime
 * `Number` constructs its Route immediately. The Route retains the supplied AST or route values and lazily memoizes derived paths and Codecs; Codec services are required only when decoding or encoding runs.
 *
 * @since 1.0.0
 * @category Parameter codecs
 */
export const Number = <const P extends string>(
  paramName: P,
): Route<`/:${P}`, Schema.Codec<{ readonly [K in P]: number }, Path.Params<`/:${P}`>>> =>
  ParamWithSchema(paramName, Schema.FiniteFromString);

/**
 * Constructs an integer path parameter decoded from a string.
 *
 * @remarks
 * ## Why
 * Integer validation is part of candidate decoding and can fall through to another candidate.
 *
 * ## Ownership and lifetime
 * `Int` constructs its Route immediately. The Route retains the supplied AST or route values and lazily memoizes derived paths and Codecs; Codec services are required only when decoding or encoding runs.
 *
 * @since 1.0.0
 * @category Parameter codecs
 */
export const Int = <const P extends string>(
  paramName: P,
): Route<`/:${P}`, Schema.Codec<{ readonly [K in P]: number }, Path.Params<`/:${P}`>>> =>
  ParamWithSchema(paramName, Schema.FiniteFromString.pipe(Schema.check(Schema.isInt())));

/**
 * Infers the normalized path, intersected decoded parameters, and codec services of joined Routes.
 *
 * @remarks
 * The combined decoded record includes every child parameter. Decoding and encoding requirements
 * are unions of the child codec requirements, so composing a service-backed parameter does not
 * make its dependency disappear. This type accompanies the value-level `Join` constructor.
 *
 * ## Ownership and lifetime
 * TypeScript computes `Join` from its Route input; the alias is erased and owns no runtime value.
 *
 * @since 1.0.0
 * @category Route composition
 */
export type Join<Routes extends ReadonlyArray<Route<any, any>>> = [
  Route<
    RouteJoinPath<Routes>,
    Schema.Codec<
      Simplify<UnionToIntersection<Routes[number]["paramsSchema"]["Type"]>>,
      Path.Params<RouteJoinPath<Routes>>,
      Routes[number]["paramsSchema"]["DecodingServices"],
      Routes[number]["paramsSchema"]["EncodingServices"]
    >
  >,
] extends [Route<infer Path, infer Schema>]
  ? Route<Path, Schema>
  : never;

type AnyRoutes = ReadonlyArray<Route<any, any> | ReadonlyArray<Route<any, any>>>;
type FlattenRoutes<T extends AnyRoutes> = T extends readonly [
  infer Head extends Route<any, any> | ReadonlyArray<Route<any, any>>,
  ...infer Tail extends AnyRoutes,
]
  ? readonly [
      ...(Head extends ReadonlyArray<Route<any, any>> ? FlattenRoutes<Head> : [Head]),
      ...FlattenRoutes<Tail>,
    ]
  : [];

const removeSlash = (ast: AST.RouteAst): ReadonlyArray<AST.RouteAst> => {
  if (ast.type === "path" && ast.path.type === "slash") return [];
  return [ast];
};

/**
 * Composes ordered Route fragments into one typed path and combined parameter codec.
 *
 * Reuse a workspace prefix in queue, issue, and settings routes without repeating its parameter
 * schema. Nested arrays of fragments are flattened. Duplicate decoded parameter names are rejected
 * during construction rather than allowing one fragment to overwrite another's value.
 *
 * The returned Route is a resource-free description. Its codecs preserve the union of decoding
 * and encoding services; no service lookup or navigation occurs while joining fragments.
 *
 * @example
 * ```ts
 * import * as Router from "@typed/router"
 *
 * const Workspace = Router.Join(Router.Parse("/workspaces"), Router.Param("workspaceId"))
 * const Issue = Router.Join(Workspace, Router.Parse("/issues"), Router.Int("issueId"))
 * type IssueInput = Router.Type<typeof Issue>
 * // { readonly workspaceId: string; readonly issueId: number }
 * ```
 *
 * @since 1.0.0
 * @category Route composition
 */
export const Join = <const Routes extends AnyRoutes>(
  ...routes: Routes
): Join<FlattenRoutes<Routes>> => {
  const parts = routes.flatMap((route) => {
    if (Array.isArray(route)) return route.flatMap(removeSlash);
    return removeSlash((route as Route<any, any>).ast);
  });
  return make(AST.join(parts));
};

type UnionToIntersection<T> = (T extends any ? (x: T) => any : never) extends (x: infer R) => any
  ? R
  : never;
type RouteJoinPath<
  Routes extends ReadonlyArray<Route<any, any>>,
  R extends string = "",
> = Routes extends readonly [
  infer First extends Route<any, any>,
  ...infer Rest extends ReadonlyArray<Route<any, any>>,
]
  ? RouteJoinPath<Rest, `${R}/${StripSlashes<First["path"]>}`>
  : R;
type StripSlashes<T extends string> = StripTrailingSlash<StripLeadingSlash<T>>;
type StripLeadingSlash<T extends string> = T extends `/${infer Rest}` ? StripLeadingSlash<Rest> : T;
type StripTrailingSlash<T extends string> = T extends `/${infer Rest}`
  ? StripTrailingSlash<Rest>
  : T;
