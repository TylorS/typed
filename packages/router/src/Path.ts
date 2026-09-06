import type { InputOf, TypeFunction } from "./TypeFunction.js";

import * as Schema from "effect/Schema";
import type { PathAst, RouteAst } from "./AST.js";
import * as AST from "./AST.js";
import type { Parser } from "./Parser.js";

type PathStopChar = "/" | ":" | "*" | "?";
type QueryValueStopChar = "&";

type TakeWhileNotInternal<
  Input extends string,
  Stop extends string,
  Acc extends string = "",
> = Input extends `${infer Head}${infer Tail}`
  ? Head extends Stop
    ? readonly [Acc, Input]
    : TakeWhileNotInternal<Tail, Stop, `${Acc}${Head}`>
  : readonly [Acc, Input];

type TakeWhileNot1Internal<Input extends string, Stop extends string> =
  TakeWhileNotInternal<Input, Stop> extends readonly [
    infer Taken extends string,
    infer Rest extends string,
  ]
    ? Taken extends ""
      ? never
      : readonly [Taken, Rest]
    : never;

interface TakeWhileNot1<Stop extends string> extends Parser<string> {
  readonly return: InputOf<this> extends infer Input extends string
    ? TakeWhileNot1Internal<Input, Stop>
    : never;
}

interface Second extends TypeFunction {
  readonly return: InputOf<this> extends readonly [infer _A, infer B] ? B : never;
}

interface RegexBetweenParens extends TypeFunction {
  readonly return: InputOf<this> extends readonly ["(", readonly [infer Regex extends string, ")"]]
    ? Regex
    : never;
}

type RegexParser = Parser.Map<
  Parser.Zip<Parser.Char<"(">, Parser.Zip<TakeWhileNot1<")">, Parser.Char<")">>>,
  RegexBetweenParens
>;

type OptionalRegexParser = Parser.Optional<RegexParser>;

type StartsWithQueryParam<
  Input extends string,
  HasName extends boolean = false,
> = Input extends `${infer Head}${infer Tail}`
  ? Head extends Parser.AlphaNumeric
    ? StartsWithQueryParam<Tail, true>
    : Head extends "="
      ? HasName
      : false
  : false;

interface OptionalQuestionMarkParser extends Parser<"?" | undefined> {
  readonly return: InputOf<this> extends infer Input extends string
    ? Input extends `?${infer Rest}`
      ? StartsWithQueryParam<Rest> extends true
        ? readonly [undefined, Input]
        : readonly ["?", Rest]
      : readonly [undefined, Input]
    : never;
}

type ParameterNameParser = Parser.Zip<Parser.Char<":">, Parser.TakeWhile1<Parser.AlphaNumeric>>;

type ParameterPartsParser = Parser.Zip<
  ParameterNameParser,
  Parser.Zip<OptionalRegexParser, OptionalQuestionMarkParser>
>;

type ParameterAst<
  Name extends string,
  Regex extends string | undefined,
  OptionalMark extends "?" | undefined,
> = [
  { readonly type: "parameter"; readonly name: Name } & ([Regex] extends [string]
    ? { regex: Regex }
    : {}) &
    ([OptionalMark] extends ["?"] ? { optional: true } : {}),
] extends [infer Ast]
  ? ToReadonlyRecord<Ast>
  : never;

interface ToParameterAst extends TypeFunction {
  readonly return: InputOf<this> extends readonly [
    readonly [":", infer Name extends string],
    readonly [infer Regex, infer OptionalMark],
  ]
    ? ParameterAst<
        Name,
        Regex extends string ? Regex : undefined,
        OptionalMark extends "?" ? OptionalMark : undefined
      >
    : never;
}

type ParameterParser = Parser.Map<ParameterPartsParser, ToParameterAst>;

interface ToWildcardAst extends TypeFunction {
  readonly return: { readonly type: "wildcard" };
}

type WildcardParser = Parser.Map<Parser.Char<"*">, ToWildcardAst>;

interface ToLiteralAst extends TypeFunction {
  readonly return: InputOf<this> extends infer Value extends string
    ? { readonly type: "literal"; readonly value: Value }
    : never;
}

type PathLiteralParser = Parser.Map<TakeWhileNot1<PathStopChar>, ToLiteralAst>;

type QueryLiteralParser = Parser.Map<TakeWhileNot1<QueryValueStopChar>, ToLiteralAst>;

type QueryValueParser = Parser.OrElse<
  ParameterParser,
  Parser.OrElse<WildcardParser, QueryLiteralParser>
>;

interface ToQueryParamAst extends TypeFunction {
  readonly return: InputOf<this> extends readonly [
    infer Name extends string,
    readonly ["=", infer Value extends PathAst],
  ]
    ? { readonly type: "query-param"; readonly name: Name; readonly value: Value }
    : never;
}

type QueryParamParser = Parser.Map<
  Parser.Zip<
    Parser.TakeWhile1<Parser.AlphaNumeric>,
    Parser.Zip<Parser.Char<"=">, QueryValueParser>
  >,
  ToQueryParamAst
>;

type QueryParamTailParser = Parser.Map<Parser.Zip<Parser.Char<"&">, QueryParamParser>, Second>;

interface PrependToTuple extends TypeFunction {
  readonly return: InputOf<this> extends readonly [
    infer Head,
    infer Tail extends ReadonlyArray<unknown>,
  ]
    ? readonly [Head, ...Tail]
    : never;
}

type QueryParamListParser = Parser.Map<
  Parser.Zip<QueryParamParser, Parser.Many<QueryParamTailParser>>,
  PrependToTuple
>;

interface ToQueryParamsAst extends TypeFunction {
  readonly return: InputOf<this> extends readonly [
    "?",
    infer Params extends ReadonlyArray<PathAst.QueryParam>,
  ]
    ? {
        readonly type: "query-params";
        readonly value: Params;
      }
    : never;
}

type QueryParamsParser = Parser.Map<
  Parser.Zip<Parser.Char<"?">, QueryParamListParser>,
  ToQueryParamsAst
>;

type PathAtomParser = Parser.OrElse<
  QueryParamsParser,
  Parser.OrElse<ParameterParser, Parser.OrElse<WildcardParser, PathLiteralParser>>
>;

type SkipSlashesParser = Parser.Optional<Parser.Many1<Parser.Char<"/">>>;

/**
 * The type-level parser for one route path atom after optional slashes.
 *
 * @remarks
 * ## Why
 * Compile-time path parsing reuses the same atom grammar as complete routes.
 *
 * ## Ownership and lifetime
 * TypeScript computes `PathParser` from the route literal or AST tuple supplied to it; the alias is erased and retains no runtime data.
 *
 * @since 1.0.0
 * @category Path parsing
 */
export type PathParser = Parser.Map<Parser.Zip<SkipSlashesParser, PathAtomParser>, Second>;

type SlashAst = { readonly type: "slash" };

type PathChunk = readonly [PathAst] | readonly [SlashAst, PathAst];

interface ToPathChunk extends TypeFunction {
  readonly return: InputOf<this> extends readonly [infer Slashes, infer Ast extends PathAst]
    ? [Slashes] extends [undefined]
      ? readonly [Ast]
      : readonly [SlashAst, Ast]
    : never;
}

type PathChunkParser = Parser.Map<Parser.Zip<SkipSlashesParser, PathAtomParser>, ToPathChunk>;

type FlattenChunks<
  Chunks extends ReadonlyArray<PathChunk>,
  Acc extends ReadonlyArray<PathAst> = readonly [],
> = Chunks extends readonly [
  infer Head extends PathChunk,
  ...infer Tail extends ReadonlyArray<PathChunk>,
]
  ? FlattenChunks<Tail, readonly [...Acc, ...Head]>
  : Acc;

type CombineChunks<First, Chunks extends ReadonlyArray<PathChunk>> = [First] extends [PathAst]
  ? readonly [First, ...FlattenChunks<Chunks>]
  : FlattenChunks<Chunks>;

interface ToAsts extends TypeFunction {
  readonly return: InputOf<this> extends readonly [
    infer First,
    infer Chunks extends ReadonlyArray<PathChunk>,
  ]
    ? CombineChunks<First, Chunks>
    : never;
}

type ParseAstsResult<Input extends string> = Parser.Run<
  Parser.Map<Parser.Zip<Parser.Optional<PathParser>, Parser.Many<PathChunkParser>>, ToAsts>,
  Input
>;

type GetAsts<R> = [R] extends [never]
  ? never
  : R extends readonly [infer Asts extends ReadonlyArray<PathAst>, infer _Rest extends string]
    ? Asts
    : never;

/**
 * Parses a route string literal into its ordered Path AST tuple.
 *
 * @remarks
 * ## Why
 * Route constructors retain literal parameter names, query declarations, and optionality in their types.
 *
 * ## Ownership and lifetime
 * TypeScript computes `ParseAsts` from the route literal or AST tuple supplied to it; the alias is erased and retains no runtime data.
 *
 * @since 1.0.0
 * @category Path parsing
 */
export type ParseAsts<Input extends string> = GetAsts<ParseAstsResult<Input>>;

type ParamsOfAst<T> = T extends {
  type: "parameter";
  name: infer Name extends string;
  optional: true;
}
  ? { [K in Name]?: string }
  : T extends { readonly type: "parameter"; readonly name: infer Name extends string }
    ? { [K in Name]: string }
    : T extends { readonly type: "wildcard" }
      ? { "*": string }
      : T extends {
            readonly type: "query-params";
            readonly value: infer Values extends ReadonlyArray<PathAst.QueryParam>;
          }
        ? ParamsOfQueryParams<Values>
        : {};

type ParamsOfQueryParams<
  T extends ReadonlyArray<PathAst.QueryParam>,
  Acc = {},
> = T extends readonly [infer Head, ...infer Tail extends ReadonlyArray<PathAst.QueryParam>]
  ? ParamsOfQueryParams<Tail, Acc & ParamsOfQueryParam<Head>>
  : Acc;

type ParamsOfQueryParam<T> = T extends {
  readonly type: "query-param";
  readonly value: infer Value extends PathAst;
}
  ? ParamsOfAst<Value>
  : {};

type GetParams<T extends ReadonlyArray<PathAst>, Acc = {}> = T extends readonly [
  infer Head,
  ...infer Tail extends ReadonlyArray<PathAst>,
]
  ? GetParams<Tail, Acc & ParamsOfAst<Head>>
  : Acc;

type PathParamsOfAst<T> = T extends {
  type: "parameter";
  name: infer Name extends string;
  optional: true;
}
  ? { [K in Name]?: string }
  : T extends { readonly type: "parameter"; readonly name: infer Name extends string }
    ? { [K in Name]: string }
    : T extends { readonly type: "wildcard" }
      ? { "*": string }
      : {};

type QueryParamsOfAst<T> = T extends {
  readonly type: "query-params";
  readonly value: infer Values extends ReadonlyArray<PathAst.QueryParam>;
}
  ? ParamsOfQueryParams<Values>
  : {};

type GetPathParams<T extends ReadonlyArray<PathAst>, Acc = {}> = T extends readonly [
  infer Head,
  ...infer Tail extends ReadonlyArray<PathAst>,
]
  ? GetPathParams<Tail, Acc & PathParamsOfAst<Head>>
  : Acc;

type GetQueryParams<T extends ReadonlyArray<PathAst>, Acc = {}> = T extends readonly [
  infer Head,
  ...infer Tail extends ReadonlyArray<PathAst>,
]
  ? GetQueryParams<Tail, Acc & QueryParamsOfAst<Head>>
  : Acc;

type ToReadonlyRecord<T> = [T] extends [infer T2] ? { readonly [K in keyof T2]: T2[K] } : never;

/**
 * Extracts decoded path-parameter fields from a route string.
 *
 * @remarks
 * ## Why
 * Handlers can distinguish path values from query values without manual record projection.
 *
 * ## Ownership and lifetime
 * TypeScript computes `PathParams` from the route literal or AST tuple supplied to it; the alias is erased and retains no runtime data.
 *
 * @since 1.0.0
 * @category Parameter inference
 */
export type PathParams<P extends string> =
  ParseAsts<P> extends infer Asts
    ? [Asts] extends [never]
      ? never
      : Asts extends ReadonlyArray<PathAst>
        ? ToReadonlyRecord<GetPathParams<Asts>>
        : never
    : never;

/**
 * Extracts decoded query-parameter fields from a route string.
 *
 * @remarks
 * ## Why
 * Declared query shapes remain visible independently of path parameters.
 *
 * ## Ownership and lifetime
 * TypeScript computes `QueryParams` from the route literal or AST tuple supplied to it; the alias is erased and retains no runtime data.
 *
 * @since 1.0.0
 * @category Parameter inference
 */
export type QueryParams<P extends string> =
  ParseAsts<P> extends infer Asts
    ? [Asts] extends [never]
      ? never
      : Asts extends ReadonlyArray<PathAst>
        ? ToReadonlyRecord<GetQueryParams<Asts>>
        : never
    : never;

/**
 * Combines decoded path and query parameter fields for a route string.
 *
 * @remarks
 * ## Why
 * Matcher handlers receive one exact parameter object derived from the route grammar.
 *
 * ## Ownership and lifetime
 * TypeScript computes `Params` from the route literal or AST tuple supplied to it; the alias is erased and retains no runtime data.
 *
 * @since 1.0.0
 * @category Parameter inference
 */
export type Params<P extends string> =
  ParseAsts<P> extends infer Asts
    ? [Asts] extends [never]
      ? never
      : Asts extends ReadonlyArray<PathAst>
        ? ToReadonlyRecord<GetParams<Asts>>
        : never
    : never;

/**
 * A runtime AST list paired with the unconsumed route suffix.
 *
 * @remarks
 * ## Why
 * Advanced parsers can compose route parsing without requiring full input consumption.
 *
 * ## Ownership and lifetime
 * `RuntimeParseResult` describes the fresh AST array and remaining string returned by runtime parsing; the alias owns neither value.
 *
 * @since 1.0.0
 * @category Path parsing
 */
export type RuntimeParseResult = readonly [asts: ReadonlyArray<PathAst>, rest: string];

/**
 * Parses route atoms and returns both AST nodes and unconsumed input.
 *
 * @remarks
 * ## Why
 * The runtime grammar can be embedded while preserving where parsing stopped.
 *
 * ## Ownership and lifetime
 * `parseWithRest` parses immediately and returns fresh AST array state; it retains neither the input string nor parser cursor.
 *
 * @example
 * ```ts
 * import { parseWithRest } from "@typed/router/Path"
 *
 * const [ast, rest] = parseWithRest("/users/:id?tab=:tab? trailing")
 * ```
 *
 * @since 1.0.0
 * @category Path parsing
 */
export function parseWithRest(input: string): RuntimeParseResult {
  let index = 0;
  const asts: Array<PathAst> = [];

  while (index < input.length) {
    const start = index;
    let hasSlash = false;
    while (index < input.length && input[index] === "/") {
      hasSlash = true;
      index++;
    }

    const atom = parseAtom(input, index);
    if (atom === undefined) {
      index = start;
      break;
    }

    if (hasSlash && asts.length > 0) {
      asts.push(AST.slash());
    }
    asts.push(atom.ast);
    index = atom.index;
  }

  return [asts, input.slice(index)];
}

/**
 * Parses a complete route string into Path AST nodes.
 *
 * @remarks
 * ## Why
 * Runtime construction stays aligned with `ParseAsts`; unsupported trailing syntax is rejected.
 *
 * ## Ownership and lifetime
 * `parse` parses immediately and returns fresh AST array state; it retains neither the input string nor parser cursor.
 *
 * @since 1.0.0
 * @category Path parsing
 */
export function parse<const P extends string>(input: P): ParseAsts<P> {
  const [asts, rest] = parseWithRest(input);
  for (let i = 0; i < rest.length; i++) {
    if (rest[i] !== "/") {
      const index = input.length - rest.length;
      throw new Error(`Failed to parse path at index ${index}`);
    }
  }
  return asts as ParseAsts<P>;
}

/**
 * Formats a tuple of Path AST nodes as its normalized route string literal type.
 *
 * @remarks
 * ## Why
 * Compile-time Route paths use the same slash, parameter, wildcard, and query formatting rules as the runtime `join` function.
 *
 * ## Ownership and lifetime
 * TypeScript computes `Join` from the route literal or AST tuple supplied to it; the alias is erased and retains no runtime data.
 *
 * @since 1.0.0
 * @category Path formatting
 */
export type Join<Parts extends ReadonlyArray<PathAst>> = `/${StringJoin<
  {
    [K in keyof Parts]: FormatAst<Parts[K]>;
  },
  ""
>}`;

type StringJoin<
  Input extends ReadonlyArray<string>,
  R extends string = "",
> = Input extends readonly [infer A extends string, ...infer Rest extends ReadonlyArray<string>]
  ? StringJoin<Rest, `${R}${A}`>
  : R;

type FormatAst<T extends PathAst> = [T] extends [PathAst.Literal]
  ? T["value"]
  : [T] extends [PathAst.Parameter]
    ? FormatParameterAst<T>
    : [T] extends [PathAst.Wildcard]
      ? `*`
      : [T] extends [PathAst.Slash]
        ? `/`
        : [T] extends [PathAst.QueryParams]
          ? FormatQueryParamsAst<T["value"]>
          : never;

type FormatParameterAst<T extends PathAst.Parameter> = `:${T["name"]}${T["regex"] extends string
  ? `(${T["regex"]})`
  : ""}${T["optional"] extends true ? "?" : ""}`;
type FormatQueryParamsAst<
  T extends ReadonlyArray<PathAst.QueryParam>,
  R extends string = "?",
> = T extends readonly [
  infer Head extends PathAst.QueryParam,
  ...infer Tail extends ReadonlyArray<PathAst.QueryParam>,
]
  ? FormatQueryParamsAst<Tail, `${R}${R extends "?" ? "" : "&"}${FormatQueryParamAst<Head>}`>
  : R;

type FormatQueryParamAst<T extends PathAst.QueryParam> = `${T["name"]}=${FormatAst<T["value"]>}`;

/**
 * Formats ordered Path AST nodes as a normalized route string.
 *
 * @remarks
 * ## Why
 * Route values derive their public path from the same AST used for schemas and matching.
 *
 * ## Ownership and lifetime
 * `join` formats immediately into a new string and retains neither the AST array nor its nodes.
 *
 * @since 1.0.0
 * @category Path formatting
 */
export function join<const Parts extends ReadonlyArray<PathAst>>(asts: Parts): Join<Parts> {
  return `/${asts.map(formatAst).join("")}` as Join<Parts>;
}

function formatAst(ast: PathAst): string {
  switch (ast.type) {
    case "literal":
      return ast.value;
    case "parameter":
      return `:${ast.name}${ast.regex === undefined ? "" : `(${ast.regex})`}${ast.optional ? "?" : ""}`;
    case "wildcard":
      return "*";
    case "slash":
      return "/";
    case "query-params":
      return `?${ast.value.map(getQueryParamAst).join("&")}`;
  }
}

function getQueryParamAst(ast: PathAst.QueryParam): string {
  return `${ast.name}=${formatAst(ast.value)}`;
}

type Atom = {
  readonly ast: PathAst;
  readonly index: number;
};

function parseAtom(input: string, index: number): Atom | undefined {
  const char = input[index];

  if (char === undefined) {
    return undefined;
  }

  if (char === "?") {
    return parseQueryParams(input, index);
  }

  if (char === ":") {
    return parseParameter(input, index);
  }

  if (char === "*") {
    return { ast: AST.wildcard(), index: index + 1 };
  }

  return parsePathLiteral(input, index);
}

function parseParameter(input: string, index: number): Atom | undefined {
  if (input[index] !== ":") {
    return undefined;
  }

  let i = index + 1;
  let name = "";
  while (i < input.length && isAlphaNumeric(input[i])) {
    name += input[i];
    i++;
  }

  if (name.length === 0) {
    return undefined;
  }

  let regex: string | undefined = undefined;
  if (input[i] === "(") {
    i++;
    const start = i;
    while (i < input.length && input[i] !== ")") {
      i++;
    }
    if (i >= input.length) {
      return undefined;
    }
    if (i === start) {
      return undefined;
    }
    regex = input.slice(start, i);
    i++;
  }

  let optional: true | undefined = undefined;
  if (input[i] === "?" && !startsWithQueryParam(input, i + 1)) {
    optional = true;
    i++;
  }

  return { ast: AST.parameter(name, optional, regex), index: i };
}

function parsePathLiteral(input: string, index: number): Atom | undefined {
  const char = input[index];
  if (char === undefined || isPathStopChar(char)) {
    return undefined;
  }

  let i = index;
  while (i < input.length && !isPathStopChar(input[i])) {
    i++;
  }

  return { ast: AST.literal(input.slice(index, i)), index: i };
}

function parseQueryParams(input: string, index: number): Atom | undefined {
  if (input[index] !== "?") {
    return undefined;
  }

  const first = parseQueryParam(input, index + 1);
  if (first === undefined) {
    return undefined;
  }

  let i = first.index;
  const params: Array<PathAst.QueryParam> = [first.ast];

  while (i < input.length && input[i] === "&") {
    const start = i;
    const next = parseQueryParam(input, i + 1);
    if (next === undefined) {
      i = start;
      break;
    }
    params.push(next.ast);
    i = next.index;
  }

  return { ast: AST.queryParams(params), index: i };
}

type QueryParamResult = {
  readonly ast: PathAst.QueryParam;
  readonly index: number;
};

function parseQueryParam(input: string, index: number): QueryParamResult | undefined {
  let i = index;
  let name = "";
  while (i < input.length && isAlphaNumeric(input[i])) {
    name += input[i];
    i++;
  }

  if (name.length === 0) {
    return undefined;
  }

  if (input[i] !== "=") {
    return undefined;
  }
  i++;

  const value = parseQueryValue(input, i);
  if (value === undefined) {
    return undefined;
  }

  return { ast: AST.queryParam(name, value.ast), index: value.index };
}

function parseQueryValue(input: string, index: number): Atom | undefined {
  const char = input[index];

  if (char === undefined) {
    return undefined;
  }

  if (char === ":") {
    return parseParameter(input, index);
  }

  if (char === "*") {
    return { ast: AST.wildcard(), index: index + 1 };
  }

  let i = index;
  while (i < input.length && input[i] !== "&") {
    i++;
  }

  if (i === index) {
    return undefined;
  }

  return { ast: AST.literal(input.slice(index, i)), index: i };
}

function isPathStopChar(char: string): boolean {
  return char === "/" || char === ":" || char === "*" || char === "?";
}

function isAlphaNumeric(char: string): boolean {
  return (
    (char >= "0" && char <= "9") || (char >= "a" && char <= "z") || (char >= "A" && char <= "Z")
  );
}

function startsWithQueryParam(input: string, index: number): boolean {
  const start = index;
  while (index < input.length && isAlphaNumeric(input[index])) index++;
  return index > start && input[index] === "=";
}

/**
 * A required decoded field name paired with its Effect Schema.
 *
 * @remarks
 * ## Why
 * Schema construction can collect route fields without losing the decoded validator.
 *
 * ## Ownership and lifetime
 * `SchemaField` is a readonly structural contract. The concrete arrays, AST nodes, names, and Schemas remain owned by the caller that constructs them.
 *
 * @since 1.0.0
 * @category Parameter schemas
 */
export type SchemaField = readonly [string, Schema.Top];
/**
 * An optional schema record key paired with its Effect Schema.
 *
 * @remarks
 * ## Why
 * Optional route parameters preserve Effect Schema's optional-key semantics.
 *
 * ## Ownership and lifetime
 * `OptionalSchemaField` is a readonly structural contract. The concrete arrays, AST nodes, names, and Schemas remain owned by the caller that constructs them.
 *
 * @since 1.0.0
 * @category Parameter schemas
 */
export type OptionalSchemaField = readonly [Schema.Record.Key, Schema.Top];
/**
 * The required, optional, and per-query schema fields derived from Path AST nodes.
 *
 * @remarks
 * ## Why
 * Path and query schemas can be projected separately from one analysis pass.
 *
 * ## Ownership and lifetime
 * `SchemaFields` is a readonly structural contract. The concrete arrays, AST nodes, names, and Schemas remain owned by the caller that constructs them.
 *
 * @since 1.0.0
 * @category Parameter schemas
 */
export type SchemaFields = {
  /**
   * Required output keys and their Codecs.
   *
   * @remarks
   * ## Why
   * Required and optional fields are passed separately to Effect Schema record construction.
   *
   * ## Ownership and lifetime
   * The containing analysis result owns this readonly array; Schema values are shared references and
   * acquire services only when decoding or encoding runs.
   *
   * @since 1.0.0
   * @category Parameter schemas
   */
  readonly requiredFields: ReadonlyArray<SchemaField>;
  /**
   * Optional output keys and their Codecs.
   *
   * @remarks
   * ## Why
   * Optional route segments and query values must remain optional in the derived record Schema.
   *
   * ## Ownership and lifetime
   * The containing analysis result owns this readonly array; Schema values are shared references and
   * acquire services only when decoding or encoding runs.
   *
   * @since 1.0.0
   * @category Parameter schemas
   */
  readonly optionalFields: ReadonlyArray<OptionalSchemaField>;
};

/**
 * Builds an Effect Schema record from required and optional route fields.
 *
 * @remarks
 * ## Why
 * All route-derived records apply the same required/optional construction rules.
 *
 * ## Ownership and lifetime
 * `schemaFromFields` constructs and returns immutable Effect Schema values immediately. Any services are required later by the Effect that executes those Schemas.
 *
 * @since 1.0.0
 * @category Parameter schemas
 */
export function schemaFromFields({ requiredFields, optionalFields }: SchemaFields): Schema.Top {
  const required = Schema.Struct(Object.fromEntries(requiredFields));
  return optionalFields.length === 0
    ? required
    : Schema.StructWithRest(
        required,
        optionalFields.map(([key, value]) => Schema.Record(key, value)),
      );
}

function schemaForParameter(param: PathAst.Parameter): Schema.Top {
  return param.regex
    ? Schema.String.pipe(Schema.check(Schema.isPattern(new RegExp(param.regex))))
    : Schema.String;
}

/**
 * Builds the decoder for one declared query value AST.
 *
 * @remarks
 * ## Why
 * Literal constraints, optional parameters, and repeated values get explicit decode behavior.
 *
 * ## Ownership and lifetime
 * `schemaForQueryValue` constructs and returns immutable Effect Schema values immediately. Any services are required later by the Effect that executes those Schemas.
 *
 * @since 1.0.0
 * @category Parameter schemas
 */
export function schemaForQueryValue(
  ast: PathAst.Literal | PathAst.Parameter | PathAst.Wildcard,
): Schema.Top {
  switch (ast.type) {
    case "literal":
      return Schema.Literal(ast.value);
    case "parameter":
      return schemaForParameter(ast);
    case "wildcard":
      return Schema.String;
  }
}

/**
 * Collects route schema fields from ordered Path AST nodes.
 *
 * @remarks
 * ## Why
 * Schema derivation remains inspectable before record construction.
 *
 * ## Ownership and lifetime
 * `getSchemaFields` walks the supplied ASTs immediately and returns fresh required/optional field arrays containing the discovered Schema references.
 *
 * @since 1.0.0
 * @category Parameter schemas
 */
export function getSchemaFields<const Parts extends ReadonlyArray<PathAst>>(parts: Parts) {
  const requiredFields: Array<[string, Schema.Top]> = [];
  const optionalFields: Array<[Schema.Record.Key, Schema.Top]> = [];
  const queryParams: Array<
    [
      string,
      {
        readonly requiredFields: Array<[string, Schema.Top]>;
        readonly optionalFields: Array<[Schema.Record.Key, Schema.Top]>;
      },
    ]
  > = [];

  function addParameter(param: PathAst.Parameter) {
    const base = schemaForParameter(param);

    if (param.optional) {
      optionalFields.push([Schema.optionalKey(Schema.Literal(param.name)), Schema.optional(base)]);
    } else {
      requiredFields.push([param.name, base]);
    }
  }

  function addQueryParams(params: ReadonlyArray<PathAst.QueryParam>) {
    for (const param of params) {
      const {
        optionalFields,
        queryParams: _queryParams,
        requiredFields,
      } = getSchemaFields([param.value]);
      queryParams.push([param.name, { optionalFields, requiredFields }]);
      // eslint-disable-next-line no-restricted-syntax
      queryParams.push(..._queryParams);
    }
  }

  function addParts(parts: ReadonlyArray<PathAst>) {
    for (const part of parts) {
      if (part.type === "parameter") {
        addParameter(part);
      } else if (part.type === "wildcard") {
        requiredFields.push(["*", Schema.String]);
      } else if (part.type === "query-params") {
        addQueryParams(part.value);
      }
    }
  }

  addParts(parts);

  return {
    requiredFields,
    optionalFields,
    queryParams,
  };
}

/**
 * Builds combined, path-only, and query-only schemas from Path AST nodes.
 *
 * @remarks
 * ## Why
 * Consumers can decode the exact projection they need without reparsing the route.
 *
 * ## Ownership and lifetime
 * `getSchemas` constructs and returns immutable Effect Schema values immediately. Any services are required later by the Effect that executes those Schemas.
 *
 * @since 1.0.0
 * @category Parameter schemas
 */
export function getSchemas<const Parts extends ReadonlyArray<PathAst>>(parts: Parts) {
  const { optionalFields, queryParams, requiredFields } = getSchemaFields(parts);
  const pathSchema = schemaFromFields({ requiredFields, optionalFields });
  const queryFields = Object.fromEntries(
    queryParams.map(([name, fields]) => [name, schemaFromFields(fields)]),
  );
  const querySchema = Schema.Struct(queryFields);
  const paramsSchema = Schema.StructWithRest(
    Schema.Struct({ ...Object.fromEntries(requiredFields), ...queryFields }),
    optionalFields.map(([key, value]) => Schema.Record(key, value)),
  );

  return {
    pathSchema,
    querySchema,
    paramsSchema,
  } as const;
}

/**
 * Flattens joined and transformed Route AST nodes to their path atoms.
 *
 * @remarks
 * ## Why
 * Formatting and input analysis can ignore schema wrappers while preserving route order.
 *
 * ## Ownership and lifetime
 * `flattenRouteAst` traverses the supplied AST immediately and returns a fresh array; child AST and Schema values in that array remain shared references.
 *
 * @since 1.0.0
 * @category Route structure validation
 */
export function flattenRouteAst(ast: RouteAst): ReadonlyArray<PathAst> {
  switch (ast.type) {
    case "path":
      return [ast.path];
    case "transform":
      return flattenRouteAst(ast.from);
    case "join": {
      const result: Array<PathAst> = [];
      for (let i = 0; i < ast.parts.length; i++) {
        const part = flattenRouteAst(ast.parts[i]);
        if (i > 0 && part[0]?.type !== "query-params") {
          result.push(AST.slash());
        }
        result.push(...part);
      }
      return result;
    }
  }
}

/**
 * Returns the decoded field names contributed by one Path AST node.
 *
 * @remarks
 * ## Why
 * Joined schema transformations can project child inputs and detect collisions.
 *
 * ## Ownership and lifetime
 * `getDecodedParamNames` traverses the supplied AST immediately and returns a fresh array; child AST and Schema values in that array remain shared references.
 *
 * @since 1.0.0
 * @category Route structure validation
 */
export function getDecodedParamNames(ast: PathAst): ReadonlyArray<string> {
  switch (ast.type) {
    case "parameter":
      return [ast.name];
    case "wildcard":
      return ["*"];
    case "query-params":
      return ast.value.flatMap((param) => getDecodedParamNames(param.value));
    case "literal":
    case "slash":
      return [];
  }
}

/**
 * Throws when a Route AST decodes the same parameter name more than once.
 *
 * @remarks
 * ## Why
 * Ambiguous merged records fail at route construction rather than silently overwriting values.
 *
 * ## Ownership and lifetime
 * `assertUniqueDecodedRouteParamNames` performs one synchronous traversal, retains nothing, and throws before a Route is constructed when decoded names collide.
 *
 * @since 1.0.0
 * @category Route structure validation
 */
export function assertUniqueDecodedRouteParamNames(ast: RouteAst): void {
  const names = new Set<string>();
  for (const part of flattenRouteAst(ast)) {
    for (const name of getDecodedParamNames(part)) {
      if (names.has(name)) {
        throw new TypeError(`Duplicate route parameter name: ${name}`);
      }
      names.add(name);
    }
  }
}

/**
 * Describes one query key expected by matcher input decoding.
 *
 * @remarks
 * ## Why
 * Matcher registration can distinguish scalar, optional, literal, and repeated query policies.
 *
 * ## Ownership and lifetime
 * `QueryInputParameter` is a readonly structural contract. The concrete arrays, AST nodes, names, and Schemas remain owned by the caller that constructs them.
 *
 * @since 1.0.0
 * @category Query decoding
 */
export type QueryInputParameter = {
  /**
   * URLSearchParams key read from matcher input.
   *
   * @remarks
   * ## Why
   * The external query key can differ from the decoded output field name.
   *
   * ## Ownership and lifetime
   * This immutable string is retained in the returned analysis record and reused for each match.
   *
   * @since 1.0.0
   * @category Query decoding
   */
  readonly inputName: string;
  /**
   * Decoded record key, absent when the AST represents a literal constraint.
   *
   * @remarks
   * ## Why
   * Literal query declarations participate in matching without adding handler parameters.
   *
   * ## Ownership and lifetime
   * This optional immutable string is retained with the analysis record and creates no decoded value
   * until a candidate is evaluated.
   *
   * @since 1.0.0
   * @category Query decoding
   */
  readonly outputName?: string;
  /**
   * Value grammar used to normalize the raw query input.
   *
   * @remarks
   * ## Why
   * Literal, scalar, optional, and repeated-value policies derive from the same Path AST.
   *
   * ## Ownership and lifetime
   * The analysis record retains this child AST by reference; request-specific strings are not stored
   * on the AST.
   *
   * @since 1.0.0
   * @category Query decoding
   */
  readonly ast: PathAst.Literal | PathAst.Parameter | PathAst.Wildcard;
};

/**
 * Collects matcher-facing query parameter declarations from a Route AST.
 *
 * @remarks
 * ## Why
 * Runtime input normalization follows the same declarations used by schema decoding.
 *
 * ## Ownership and lifetime
 * `getQueryInputParameters` traverses the supplied AST immediately and returns a fresh array; child AST and Schema values in that array remain shared references.
 *
 * @since 1.0.0
 * @category Query decoding
 */
export function getQueryInputParameters(ast: RouteAst): ReadonlyArray<QueryInputParameter> {
  const output: Array<QueryInputParameter> = [];
  const visitPath = (path: PathAst): void => {
    if (path.type !== "query-params") return;
    for (const parameter of path.value) {
      const value = parameter.value;
      if (value.type === "literal") {
        output.push({ inputName: parameter.name, ast: value });
      } else if (value.type === "parameter") {
        output.push({ inputName: parameter.name, outputName: value.name, ast: value });
      } else if (value.type === "wildcard") {
        output.push({ inputName: parameter.name, outputName: "*", ast: value });
      }
    }
  };
  const visitRoute = (route: RouteAst): void => {
    switch (route.type) {
      case "path":
        visitPath(route.path);
        break;
      case "transform":
        visitRoute(route.from);
        break;
      case "join":
        route.parts.forEach(visitRoute);
        break;
    }
  };
  visitRoute(ast);
  return output;
}

/**
 * Builds the Effect Schema used to normalize matcher query input.
 *
 * @remarks
 * ## Why
 * Repeated scalar values and literal constraints fail before handler selection.
 *
 * ## Ownership and lifetime
 * `getQueryInputSchema` constructs and returns immutable Effect Schema values immediately. Any services are required later by the Effect that executes those Schemas.
 *
 * @since 1.0.0
 * @category Query decoding
 */
export function getQueryInputSchema(ast: RouteAst): Schema.Top {
  const requiredFields: Array<[string, Schema.Top]> = [];
  const optionalFields: Array<[Schema.Record.Key, Schema.Top]> = [];
  for (const parameter of getQueryInputParameters(ast)) {
    const schema = schemaForQueryValue(parameter.ast);
    if (parameter.ast.type === "parameter" && parameter.ast.optional) {
      optionalFields.push([
        Schema.optionalKey(Schema.Literal(parameter.inputName)),
        Schema.optional(schema),
      ]);
    } else {
      requiredFields.push([parameter.inputName, schema]);
    }
  }
  return schemaFromFields({ requiredFields, optionalFields });
}
