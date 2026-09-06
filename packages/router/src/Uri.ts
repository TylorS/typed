import type { Apply, Identity, InputOf, Pipe, TypeFunction } from "./TypeFunction.js";

/**
 * Parses a URI string literal into component literal types, optionally against a base URI.
 *
 * @remarks
 * ## Why
 * Route type utilities can reason about origin and path components without widening to string.
 *
 * ## Ownership and lifetime
 * `ParseUri` evaluates the URI parser only for string-literal inputs; its component result is erased from emitted JavaScript.
 *
 * @example
 * ```ts
 * import type { ParseUri } from "@typed/router/Uri"
 *
 * type Account = ParseUri<"/account?tab=profile", "https://example.com/">
 * ```
 *
 * @since 1.0.0
 * @category URI type inference
 */
export type ParseUri<Input extends string, BaseUri extends string = never> =
  Pipe<
    Input,
    ParseUriLambda,
    [BaseUri] extends [never] ? Identity : ApplyBaseUriLambda<ParseUri<BaseUri>>
  > extends infer R
    ? Uri<
        GetUriKey<R, "protocol">,
        GetUriKey<R, "username">,
        GetUriKey<R, "password">,
        GetUriKey<R, "hostname">,
        GetUriKey<R, "port">,
        GetUriKey<R, "pathname">,
        GetUriKey<R, "query">,
        GetUriKey<R, "hash">
      >
    : never;

/**
 * A type-level URI component record.
 *
 * @remarks
 * ## Why
 * Parsing and formatting share one explicit protocol, authentication, host, path, query, and hash shape.
 *
 * ## Ownership and lifetime
 * `Uri` is a compile-time component record. Supplying its type arguments creates no runtime URL object or retained input.
 *
 * @since 1.0.0
 * @category URI type inference
 */
export interface Uri<
  Protocol extends string = string,
  Username extends string = "",
  Password extends string = "",
  Hostname extends string = string,
  Port extends number | "" = "",
  Pathname extends string = "/",
  Query extends string = "",
  Hash extends string = "",
> {
  /**
   * The URI scheme component.
   *
   * @remarks
   * ## Why
   * Formatting normalizes its colon and double-slash delimiters.
   *
   * ## Ownership and lifetime
   * The `Uri.protocol` component is carried only as a type argument on `Uri`; no runtime field or resource exists.
   *
   * @since 1.0.0
   * @category URI type inference
   */
  readonly protocol: Protocol;
  /**
   * The URI authentication username component.
   *
   * @remarks
   * ## Why
   * Authentication formatting remains separate from host and path.
   *
   * ## Ownership and lifetime
   * The `Uri.username` component is carried only as a type argument on `Uri`; no runtime field or resource exists.
   *
   * @since 1.0.0
   * @category URI type inference
   */
  readonly username: Username;
  /**
   * The URI authentication password component.
   *
   * @remarks
   * ## Why
   * Authentication formatting can preserve an explicitly empty or literal password.
   *
   * ## Ownership and lifetime
   * The `Uri.password` component is carried only as a type argument on `Uri`; no runtime field or resource exists.
   *
   * @since 1.0.0
   * @category URI type inference
   */
  readonly password: Password;
  /**
   * The URI host-name component.
   *
   * @remarks
   * ## Why
   * Base-URI application can inherit host identity independently of path/query/hash.
   *
   * ## Ownership and lifetime
   * The `Uri.hostname` component is carried only as a type argument on `Uri`; no runtime field or resource exists.
   *
   * @since 1.0.0
   * @category URI type inference
   */
  readonly hostname: Hostname;
  /**
   * The numeric port component or an absent empty string.
   *
   * @remarks
   * ## Why
   * Formatting adds a colon only when a port exists.
   *
   * ## Ownership and lifetime
   * The `Uri.port` component is carried only as a type argument on `Uri`; no runtime field or resource exists.
   *
   * @since 1.0.0
   * @category URI type inference
   */
  readonly port: Port;
  /**
   * The URI pathname component.
   *
   * @remarks
   * ## Why
   * Relative input can replace the base path without changing inherited origin components.
   *
   * ## Ownership and lifetime
   * The `Uri.pathname` component is carried only as a type argument on `Uri`; no runtime field or resource exists.
   *
   * @since 1.0.0
   * @category URI type inference
   */
  readonly pathname: Pathname;
  /**
   * The URI query component without its leading question mark.
   *
   * @remarks
   * ## Why
   * Formatting controls delimiters while preserving the literal query payload.
   *
   * ## Ownership and lifetime
   * The `Uri.query` component is carried only as a type argument on `Uri`; no runtime field or resource exists.
   *
   * @since 1.0.0
   * @category URI type inference
   */
  readonly query: Query;
  /**
   * The URI fragment component without its leading hash.
   *
   * @remarks
   * ## Why
   * Formatting controls delimiters while preserving the literal fragment payload.
   *
   * ## Ownership and lifetime
   * The `Uri.hash` component is carried only as a type argument on `Uri`; no runtime field or resource exists.
   *
   * @since 1.0.0
   * @category URI type inference
   */
  readonly hash: Hash;
}

/**
 * @since 1.0.0
 */
export declare namespace Uri {
  /**
   * A Uri whose component literal types are intentionally widened.
   *
   * @remarks
   * ## Why
   * Generic URI utilities can constrain shape without claiming a specific parsed literal.
   *
   * ## Ownership and lifetime
   * The `Any` component is carried only as a type argument on `Uri`; no runtime field or resource exists.
   *
   * @since 1.0.0
   * @category URI type inference
   */
  export type Any = Uri<string, string, string, string, number | "", string, string, string>;
}

/**
 * Formats a type-level Uri record as a string literal, optionally after applying a base URI.
 *
 * @remarks
 * ## Why
 * Type-level URI transformations can return the exact normalized string shape.
 *
 * ## Ownership and lifetime
 * `FormatUri` assembles only a string-literal type from the supplied `Uri`; it produces no runtime string.
 *
 * @since 1.0.0
 * @category URI type inference
 */
export type FormatUri<Uri extends Uri.Any, BaseUri extends string = never> = Apply<
  FormatUrlLambda,
  [BaseUri] extends [never] ? Uri : Apply<ApplyBaseUriLambda<ParseUri<BaseUri>>, Uri>
>;

// Internal

interface FormatUrlLambda extends TypeFunction {
  readonly return: InputOf<this> extends infer Uri extends Uri.Any
    ? StringJoin<
        [
          FormatProtocol<Uri["protocol"]>,
          FormatAuthentication<Uri["username"], Uri["password"]>,
          FormatHostname<Uri["hostname"]>,
          FormatPort<Uri["port"]>,
          FormatPathname<Uri["pathname"]>,
          FormatQuery<Uri["query"]>,
          FormatHash<Uri["hash"]>,
        ]
      >
    : never;
}

type IfNotEmpty<T, Then> = IsEmpty<T> extends 1 ? "" : Then;

type FormatProtocol<Protocol extends string> = IfNotEmpty<
  Protocol,
  EnsureEndsWithDoubleSlash<EnsureEndsWithColon<Protocol>>
>;

type EnsureEndsWithColon<T extends string> = `${T extends `${infer Rest}:` ? Rest : T}:`;
type EnsureEndsWithDoubleSlash<T extends string> = T extends `${infer Rest}//`
  ? Rest
  : T extends `${infer Rest}/`
    ? `${Rest}//`
    : `${T}//`;

type FormatAuthentication<Username extends string, Password extends string> = {
  0: `${Username}:${Password}@`;
  1: "";
}[IsEmpty<Username> & IsEmpty<Password>];

type FormatHostname<Hostname extends string> = IfNotEmpty<Hostname, Hostname>;

type FormatPort<Port extends number | ""> = IfNotEmpty<Port, EnsureStartsWithColon<`${Port}`>>;

type EnsureStartsWithColon<T extends string> = T extends `:${infer _}` ? T : `:${T}`;

type FormatPathname<Pathname extends string> = IfNotEmpty<
  Pathname,
  EnsureStartsWithSlash<`${Pathname}`>
>;

type EnsureStartsWithSlash<T extends string> = T extends `/${infer _}` ? T : `/${T}`;

type FormatQuery<Query extends string> = IfNotEmpty<
  Query,
  EnsureStartsWithQuestionMark<`${Query}`>
>;

type EnsureStartsWithQuestionMark<T extends string> = T extends `?${infer _}` ? T : `?${T}`;

type FormatHash<Hash extends string> = IfNotEmpty<Hash, EnsureStartsWithHash<`${Hash}`>>;

type EnsureStartsWithHash<T extends string> = T extends `#${infer _}` ? T : `#${T}`;

type IsEmpty<T> = [T] extends [""] ? 1 : [T] extends [never] ? 1 : 0;

type GetUriKey<UriLike, Key extends keyof Uri> = Key extends keyof UriLike
  ? UriLike[Key] extends Uri.Any[Key]
    ? UriLike[Key]
    : Uri[Key]
  : Uri[Key];

interface ParseUriLambda extends TypeFunction<string, Uri> {
  return: InputOf<this> extends infer R
    ? Pipe<
        [{}, R],
        UriParserReducerLambda<ParseHashLambda>,
        UriParserReducerLambda<ParseQueryLambda>,
        UriParserReducerLambda<ParseProtocolLambda>,
        UriParserReducerLambda<ParseAuthenticationLambda>,
        UriParserReducerLambda<ParsePathnamePortPathnameLambda>
      > extends readonly [infer Result, infer Remaining extends string]
      ? Remaining extends ""
        ? Result
        : `Failed to parse URI: ${InputOf<this>}`
      : never
    : never;
}

interface UriParserReducerLambda<F extends TypeFunction> extends TypeFunction {
  return: InputOf<this> extends readonly [infer State, infer Input extends string]
    ? Pipe<Input, F> extends readonly [infer NextState, infer Remaining extends string]
      ? [NextState & State, Remaining]
      : never
    : never;
}

interface ParseProtocolLambda extends TypeFunction {
  readonly return: InputOf<this> extends `${infer Protocol}//${infer Rest}`
    ? [{ readonly protocol: Protocol }, Rest]
    : [unknown, InputOf<this>];
}

interface ParseHashLambda extends TypeFunction {
  readonly return: InputOf<this> extends `${infer Rest}#${infer Hash}`
    ? [{ readonly hash: Hash }, Rest]
    : [unknown, InputOf<this>];
}

interface ParseQueryLambda extends TypeFunction {
  readonly return: InputOf<this> extends `${infer Rest}?${infer Query}`
    ? [{ readonly query: Query }, Rest]
    : [unknown, InputOf<this>];
}

interface ParseAuthenticationLambda extends TypeFunction {
  readonly return: InputOf<this> extends `${infer Username}:${infer Password}@${infer Rest}`
    ? [{ readonly username: Username; readonly password: Password }, Rest]
    : [unknown, InputOf<this>];
}

interface ParsePathnamePortPathnameLambda extends TypeFunction {
  readonly return: InputOf<this> extends `${infer Hostname}:${infer Port extends number}/${infer Pathname}`
    ? [{ readonly hostname: Hostname; readonly port: Port; readonly pathname: Pathname }, ""]
    : InputOf<this> extends `${infer Hostname}:${infer Port extends number}`
      ? [{ readonly hostname: Hostname; readonly port: Port }, ""]
      : InputOf<this> extends `${infer Hostname}/${infer Pathname}`
        ? "" extends Hostname
          ? [{ readonly pathname: Pathname }, ""]
          : [{ readonly hostname: Hostname; readonly pathname: Pathname }, ""]
        : InputOf<this> extends `${infer Hostname}`
          ? [{ readonly hostname: Hostname }, ""]
          : [unknown, InputOf<this>];
}

interface ApplyBaseUriLambda<BaseUri extends Uri.Any> extends TypeFunction<Uri.Any, Uri.Any> {
  readonly return: InputOf<this> extends infer R extends Uri.Any
    ? Uri<
        GetUriKey<BaseUri, "protocol">,
        GetUriKey<BaseUri, "username">,
        GetUriKey<BaseUri, "password">,
        GetUriKey<BaseUri, "hostname">,
        GetUriKey<BaseUri, "port">,
        GetUriKey<R, "pathname">,
        GetUriKey<R, "query">,
        GetUriKey<R, "hash">
      >
    : never;
}

type StringJoin<
  Input extends ReadonlyArray<string>,
  R extends string = "",
> = Input extends readonly [infer A extends string, ...infer Rest extends ReadonlyArray<string>]
  ? StringJoin<Rest, `${R}${A}`>
  : R;
