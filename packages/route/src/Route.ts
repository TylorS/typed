import { ArrayFormatter, TreeFormatter } from "@effect/schema"
import type { ParseIssue } from "@effect/schema/ParseResult"
import * as Schema from "@effect/schema/Schema"
import type { NanoId } from "@typed/id/NanoId"
import * as ID from "@typed/id/Schema"
import type { Uuid } from "@typed/id/Uuid"
import type * as Path from "@typed/path"
import * as AST from "@typed/route/AST"
import type { Types } from "effect"
import { Data, Effect, Option, ReadonlyRecord } from "effect"
import type { NoSuchElementException } from "effect/Cause"
import { dual, flow, pipe } from "effect/Function"
import { type Pipeable, pipeArguments } from "effect/Pipeable"
import * as ptr from "path-to-regexp"
import type { N } from "ts-toolbelt"

/**
 * @since 1.0.0
 */
export const RouteTypeId = Symbol.for("@typed/route/Route")

/**
 * @since 1.0.0
 */
export type RouteTypeId = typeof RouteTypeId

/**
 * @since 1.0.0
 */
export interface Route<
  P extends string,
  S extends Schema.Schema.All = never
> extends Pipeable {
  readonly [RouteTypeId]: Route.Variance<P, S>
  readonly ast: AST.AST

  readonly path: P

  readonly schema: [S] extends [never] ? Route.Schema<this> : S

  readonly match: (path: string) => Option.Option<Path.ParamsOf<P>>

  readonly interpolate: <P2 extends Path.ParamsOf<P>>(params: P2) => Path.Interpolate<P, P2>

  readonly concat: <R2 extends Route.Any>(
    right: R2
  ) => Route<
    Path.PathJoin<[P, Route.Path<R2>]>,
    Route.ConcatSchemas<S, Route.Schema<R2>>
  >

  readonly optional: () => Route<Path.Optional<P>, S>

  readonly oneOrMore: () => Route<Path.OneOrMore<P>, S>

  readonly zeroOrMore: () => Route<Path.ZeroOrMore<P>, S>

  readonly prefix: <P2 extends string>(
    prefix: P2
  ) => Route<Path.Prefix<P2, P>, S>
}

/**
 * @since 1.0.0
 */
export namespace Route {
  /**
   * @since 1.0.0
   */
  export type Any = Route<any, any> | Route<any, never>

  /**
   * @since 1.0.0
   */
  export interface Variance<
    P extends string,
    S extends Schema.Schema.All
  > {
    readonly _P: Types.Invariant<P>
    readonly _S: Types.Invariant<S>
  }

  /**
   * @since 1.0.0
   */
  export type Path<T> = [T] extends [never] ? never
    : T extends Route<infer P, infer _> ? P
    : never

  /**
   * @since 1.0.0
   */
  export type Schema<T> = [T] extends [never] ? never
    : T extends Route<infer _, infer S> ? [S] extends [never] ? SchemaFromPath<_> : S
    : never

  /**
   * @since 1.0.0
   */
  export type Output<R extends Route.Any> = Schema.Schema.Type<Schema<R>>

  /**
   * @since 1.0.0
   */
  export type Params<R extends Route.Any> = Path.ParamsOf<Route.Path<R>>

  /**
   * @since 1.0.0
   */
  export type Context<R extends Route.Any> = Schema.Schema.Context<Schema<R>>

  /**
   * @since 1.0.0
   */
  export type Interpolate<R extends Route.Any, P extends Route.Params<R>> = Path.Interpolate<Route.Path<R>, P>

  /**
   * @since 1.0.0
   */
  export type UpdatePath<T, P extends string> = T extends Route<infer _, infer S> ? Route<P, S> : never

  /**
   * @since 1.0.0
   */
  export type UpdateSchema<T, S extends Schema.Schema.All> = T extends Route<infer P, infer _> ? Route<P, S>
    : never

  /**
   * @since 1.0.0
   */
  export type ConcatSchemas<S1 extends Schema.Schema.All, S2 extends Schema.Schema.All> = [S1] extends [never] ? S2 :
    [S2] extends [never] ? S1 :
    Schema.Schema<
      MergeSchemaTypes<Schema.Schema.Type<S1>, Schema.Schema.Type<S2>>,
      MergeSchemaTypes<Schema.Schema.Encoded<S1>, Schema.Schema.Encoded<S2>>,
      Schema.Schema.Context<S1> | Schema.Schema.Context<S2>
    >

  type MergeSchemaTypes<A, B> = CountUnnamedParams<A> extends infer R extends number
    ? Types.Simplify<A & IncrementUnnamedParams<B, R>>
    : never

  type CountUnnamedParams<T, Count extends number = 0> = Count extends keyof T ? CountUnnamedParams<T, N.Add<Count, 1>>
    : Count

  type IncrementUnnamedParams<T, Count extends number> = Count extends 0 ? T : {
    [K in keyof T as K extends number ? N.Add<K, Count> : K]: T[K]
  }

  /**
   * @since 1.0.0
   */
  export type SchemaFromPath<P extends string> = Schema.Schema<Path.ParamsOf<P>>
}

const variance_: Route.Variance<any, any> = {
  _P: (_) => _,
  _S: (_) => _
}

class RouteImpl<P extends string, S extends Schema.Schema.All> implements Route<P, S> {
  readonly [RouteTypeId]: Route.Variance<P, S> = variance_

  constructor(readonly ast: AST.AST) {
    this.pipe = this.pipe.bind(this)
    this.concat = this.concat.bind(this)
  }

  private __path!: any
  get path(): P {
    return this.__path ??= AST.toPath(this.ast) as P
  }

  private __schema!: any
  get schema() {
    return (this.__schema ??= AST.toSchema(this.ast) as any) as any
  }

  private __match!: Route<P, S>["match"]
  match(path: string) {
    const m = (this.__match ??= getMatch(this as any) as any)
    return m(path)
  }

  private __interpolate!: Route<P, S>["interpolate"]
  interpolate<P2 extends Path.ParamsOf<P>>(
    params: P2
  ) {
    const i = (this.__interpolate ??= getInterpolate(this as any) as any)
    return i(params)
  }

  pipe() {
    return pipeArguments(this, arguments)
  }

  concat<R2 extends Route.Any>(right: R2) {
    return make(new AST.Concat(this.ast, right.ast)) as any
  }

  optional() {
    return make(new AST.Optional(this.ast)) as any
  }

  oneOrMore() {
    return make(new AST.OneOrMore(this.ast)) as any
  }

  zeroOrMore() {
    return make(new AST.ZeroOrMore(this.ast)) as any
  }

  prefix<P2 extends string>(prefix: P2) {
    return make(new AST.Prefix(prefix, this.ast)) as any
  }
}

/**
 * @since 1.0.0
 */
export const make = <P extends string, S extends Schema.Schema.All>(
  ast: AST.AST
): Route<P, S> => new RouteImpl(ast)

/**
 * @since 1.0.0
 */
export const lit = <const L extends string>(literal: L): Route<L> => make(new AST.Literal(literal))

/**
 * @since 1.0.0
 */
export const end: Route<"/"> = make(new AST.Literal("/"))

/**
 * @since 1.0.0
 */
export const param = <const Name extends string>(name: Name): Route<Path.Param<Name>> => make(new AST.Param(name))

/**
 * @since 1.0.0
 */
export const num = <const Name extends string>(
  name: Name
): Route<Path.Param<Name>, Schema.Schema<{ readonly [_ in Name]: number }, { readonly [_ in Name]: string }>> =>
  schema(
    param(name),
    Schema.struct(ReadonlyRecord.singleton(name, Schema.NumberFromString)) as any
  )

/**
 * @since 1.0.0
 */
export const int = <const Name extends string>(
  name: Name
): Route<Path.Param<Name>, Schema.Schema<{ readonly [_ in Name]: number }, { readonly [_ in Name]: string }>> =>
  schema(
    param(name),
    Schema.struct(ReadonlyRecord.singleton(name, Schema.NumberFromString.pipe(Schema.int()))) as any
  )

/**
 * @since 1.0.0
 */
export const uuid = <const Name extends string>(
  name: Name
): Route<Path.Param<Name>, Schema.Schema<{ readonly [_ in Name]: Uuid }, { readonly [_ in Name]: string }>> =>
  schema(
    param(name),
    Schema.struct(ReadonlyRecord.singleton(name, ID.uuid)) as any
  )

/**
 * @since 1.0.0
 */
export const nanoId = <const Name extends string>(
  name: Name
): Route<Path.Param<Name>, Schema.Schema<{ readonly [_ in Name]: NanoId }, { readonly [_ in Name]: string }>> =>
  schema(
    param(name),
    Schema.struct(ReadonlyRecord.singleton(name, ID.nanoId)) as any
  )

/**
 * @since 1.0.0
 */
export const unnamed: Route<Path.Unnamed> = make(new AST.UnnamedParam())

/**
 * @since 1.0.0
 */
export const zeroOrMore = <R extends Route<any, never>>(
  route: R
): Route.UpdatePath<R, Path.ZeroOrMore<Route.Path<R>>> =>
  make(new AST.ZeroOrMore(route.ast)) as Route.UpdatePath<R, Path.ZeroOrMore<Route.Path<R>>>

/**
 * @since 1.0.0
 */
export const oneOrMore = <R extends Route<any, never>>(
  route: R
): Route.UpdatePath<R, Path.OneOrMore<Route.Path<R>>> =>
  make(new AST.OneOrMore(route.ast)) as Route.UpdatePath<R, Path.OneOrMore<Route.Path<R>>>

/**
 * @since 1.0.0
 */
export const optional = <R extends Route<any, never>>(route: R): Route.UpdatePath<R, Path.Optional<Route.Path<R>>> =>
  make(new AST.Optional(route.ast)) as Route.UpdatePath<R, Path.Optional<Route.Path<R>>>

/**
 * @since 1.0.0
 */
export const prefix: {
  <P extends string>(
    prefix: P
  ): <R extends Route.Any>(route: R) => Route.UpdatePath<R, Path.Prefix<P, Route.Path<R>>>
  <R extends Route.Any, P extends string>(prefix: P, route: R): Route.UpdatePath<R, `{${P}${Route.Path<R>}}`>
} = <R extends Route.Any, P extends string>(
  ...args: [P] | [P, R]
): any => {
  if (args.length === 1) {
    return (route: R) => make(new AST.Prefix(args[0], route.ast)) as Route.UpdatePath<R, Path.Prefix<P, Route.Path<R>>>
  }

  return make(new AST.Prefix(args[0], args[1].ast)) as Route.UpdatePath<R, Path.Prefix<P, Route.Path<R>>>
}

/**
 * @since 1.0.0
 */
export const concat: {
  <R extends Route.Any>(right: R): <L extends Route.Any>(
    left: L
  ) => Route<Path.PathJoin<[Route.Path<L>, Route.Path<R>]>, Route.ConcatSchemas<Route.Schema<L>, Route.Schema<R>>>

  <L extends Route.Any, R extends Route.Any>(
    left: L,
    right: R
  ): Route<Path.PathJoin<[Route.Path<L>, Route.Path<R>]>, Route.ConcatSchemas<Route.Schema<L>, Route.Schema<R>>>
} = dual(2, <L extends Route.Any, R extends Route.Any>(
  left: L,
  right: R
): Route<Path.PathJoin<[Route.Path<L>, Route.Path<R>]>, Route.ConcatSchemas<Route.Schema<L>, Route.Schema<R>>> =>
  make(new AST.Concat(left.ast, right.ast)) as Route<
    Path.PathJoin<[Route.Path<L>, Route.Path<R>]>,
    Route.ConcatSchemas<Route.Schema<L>, Route.Schema<R>>
  >)

/**
 * @since 1.0.0
 */
export const schema: {
  <R extends Route<any, never>, S extends Schema.Schema<any, Path.ParamsOf<Route.Path<R>>, any>>(
    schema: S
  ): (route: R) => Route.UpdateSchema<R, S>

  <R extends Route<any, never>, S extends Schema.Schema<any, Path.ParamsOf<Route.Path<R>>, any>>(
    route: R,
    schema: S
  ): Route.UpdateSchema<R, S>
} = dual(2, <
  R extends Route<any, never>,
  S extends Schema.Schema<any, Path.ParamsOf<Route.Path<R>>, any>
>(
  route: R,
  schema: S
): Route.UpdateSchema<R, S> => make(new AST.WithSchema(route.ast, schema)) as Route.UpdateSchema<R, S>)

/**
 * @since 1.0.0
 */
export const getPath = <R extends Route.Any>(route: R): Route.Path<R> => AST.toPath(route.ast) as Route.Path<R>

/**
 * @since 1.0.0
 */
export const getSchema = <R extends Route.Any>(route: R): Route.Schema<R> => AST.toSchema(route.ast) as Route.Schema<R>

/**
 * @since 1.0.0
 */
export function getMatch<R extends Route.Any>(
  route: R,
  options?: Parameters<typeof ptr.match>[1]
): (path: string) => Option.Option<Route.Params<R>> {
  const match: ptr.MatchFunction = ptr.match(route.path, { end: route.path === "/", ...options })

  return (path: string): Option.Option<Route.Params<R>> => {
    const matched = match(path)

    return matched === false ? Option.none() : Option.some(matched.params as Route.Params<R>)
  }
}

/**
 * @since 1.0.0
 */
export function getInterpolate<R extends Route.Any>(
  route: R,
  options?: Parameters<typeof ptr.compile>[1]
): <P extends Route.Params<R>>(params: P) => Route.Interpolate<R, P> {
  const interpolate = ptr.compile(route.path, options)

  return (params: Route.Params<R>): Route.Interpolate<R, typeof params> => interpolate(params) || "/" as any
}

/**
 * @since 1.0.0
 */
export class RouteDecodeError<R extends Route.Any> extends Data.TaggedError("RouteDecodeError")<{
  readonly route: R
  readonly issue: ParseIssue
}> {
  toJSON(): unknown {
    return {
      _tag: "RouteDecodeError",
      route: this.route.path,
      issue: ArrayFormatter.formatIssue(this.issue)
    }
  }

  toString() {
    return `RouteDecodeError: ${this.route.path}\n${TreeFormatter.formatIssue(this.issue)}`
  }
}

/**
 * @since 1.0.0
 */
export const decode: {
  (path: string): <R extends Route.Any>(
    route: R
  ) => Effect.Effect<
    Route.Output<R>,
    NoSuchElementException | RouteDecodeError<R>,
    Schema.Schema.Context<Route.Schema<R>>
  >

  <R extends Route.Any>(
    route: R,
    path: string
  ): Effect.Effect<
    Route.Output<R>,
    NoSuchElementException | RouteDecodeError<R>,
    Schema.Schema.Context<Route.Schema<R>>
  >
} = dual(2, function decode<R extends Route.Any>(
  route: R,
  path: string
): Effect.Effect<Route.Output<R>, NoSuchElementException | RouteDecodeError<R>, Route.Context<R>> {
  const params = route.match(path) as Option.Option<Route.Params<R>>
  const decode = flow(
    Schema.decode(route.schema),
    Effect.catchAll((error) => new RouteDecodeError({ route, issue: error.error }))
  ) as (params: Route.Params<R>) => Effect.Effect<
    Route.Output<R>,
    RouteDecodeError<R>,
    Route.Context<R>
  >

  return Effect.flatMap(params, decode)
})

/**
 * @since 1.0.0
 */
export const decode_: {
  <R extends Route.Any>(
    route: R
  ): (path: string) => Effect.Effect<
    Route.Output<R>,
    NoSuchElementException | RouteDecodeError<R>,
    Schema.Schema.Context<Route.Schema<R>>
  >

  <R extends Route.Any>(
    path: string,
    route: R
  ): Effect.Effect<
    Route.Output<R>,
    NoSuchElementException | RouteDecodeError<R>,
    Schema.Schema.Context<Route.Schema<R>>
  >
} = dual(2, <R extends Route.Any>(
  path: string,
  route: R
): Effect.Effect<Route.Output<R>, NoSuchElementException | RouteDecodeError<R>, Route.Context<R>> =>
  decode(route, path))

/**
 * @since 1.0.0
 */
export class RouteEncodeError<R extends Route.Any> extends Data.TaggedError("RouteEncodeError")<{
  readonly route: R
  readonly issue: ParseIssue
}> {
  toJSON(): unknown {
    return {
      _tag: "RouteEncodeError",
      route: this.route.path,
      issue: ArrayFormatter.formatIssue(this.issue)
    }
  }

  toString() {
    return `RouteEncodeError: ${this.route.path}\n${TreeFormatter.formatIssue(this.issue)}`
  }
}

/**
 * @since 1.0.0
 */
export const encode: {
  <R extends Route.Any, O extends Route.Output<R>>(
    params: O
  ): (route: R) => Effect.Effect<Route.Interpolate<R, Route.Params<R>>, RouteEncodeError<R>, Route.Context<R>>

  <R extends Route.Any, O extends Route.Output<R>>(
    route: R,
    params: O
  ): Effect.Effect<Route.Interpolate<R, Route.Params<R>>, RouteEncodeError<R>, Route.Context<R>>
} = dual(2, function<R extends Route.Any, O extends Route.Output<R>>(
  route: R,
  params: O
): Effect.Effect<Route.Interpolate<R, Route.Params<R>>, RouteEncodeError<R>, Route.Context<R>> {
  return pipe(
    params,
    Schema.encode(route.schema as Route.Schema<R>),
    Effect.catchAll((error) => new RouteEncodeError({ route, issue: error.error })),
    Effect.map((params) => route.interpolate(params as Route.Params<R>))
  ) as any
})

/**
 * @since 1.0.0
 */
export const encode_: {
  <R extends Route.Any, O extends Route.Output<R>>(
    route: R
  ): (params: O) => Effect.Effect<Route.Interpolate<R, Route.Params<R>>, RouteEncodeError<R>, Route.Context<R>>

  <R extends Route.Any, O extends Route.Output<R>>(
    params: O,
    route: R
  ): Effect.Effect<Route.Interpolate<R, Route.Params<R>>, RouteEncodeError<R>, Route.Context<R>>
} = dual(2, <R extends Route.Any, O extends Route.Output<R>>(
  params: O,
  route: R
): Effect.Effect<Route.Interpolate<R, Route.Params<R>>, RouteEncodeError<R>, Route.Context<R>> =>
  encode(route, params) as any)

/**
 * @since 1.0.0
 */
export const transform: {
  <R extends Route.Any, S extends Schema.Schema.Any>(
    toSchema: S,
    from: (o: Route.Output<R>) => Schema.Schema.Encoded<S>,
    to: (s: Schema.Schema.Encoded<S>) => Route.Output<R>
  ): (route: R) => Route.UpdateSchema<R, Schema.transform<Route.Schema<R>, S>>

  <R extends Route.Any, S extends Schema.Schema.Any>(
    route: R,
    toSchema: S,
    from: (o: Route.Output<R>) => Schema.Schema.Encoded<S>,
    to: (s: Schema.Schema.Encoded<S>) => Route.Output<R>
  ): Route.UpdateSchema<R, Schema.transform<Route.Schema<R>, S>>
} = dual(4, function transform<R extends Route.Any, S extends Schema.Schema.Any>(
  route: R,
  toSchema: S,
  from: (o: Route.Output<R>) => Schema.Schema.Encoded<S>,
  to: (s: Schema.Schema.Encoded<S>) => Route.Output<R>
): Route.UpdateSchema<R, Schema.transform<Route.Schema<R>, S>> {
  return schema(route as any, Schema.transform(route.schema, toSchema, from, to) as any) as any
})

export const transformOrFail: {
  <R extends Route.Any, S extends Schema.Schema.Any, R2>(
    toSchema: S,
    from: (o: Route.Output<R>) => Effect.Effect<Schema.Schema.Encoded<S>, ParseIssue, R2>,
    to: (s: Schema.Schema.Encoded<S>) => Effect.Effect<Route.Output<R>, ParseIssue, R2>
  ): (route: R) => Route.UpdateSchema<R, Schema.transformOrFail<Route.Schema<R>, S, R2>>

  <R extends Route.Any, S extends Schema.Schema.Any, R2>(
    route: R,
    toSchema: S,
    from: (o: Route.Output<R>) => Effect.Effect<Schema.Schema.Encoded<S>, ParseIssue, R2>,
    to: (s: Schema.Schema.Encoded<S>) => Effect.Effect<Route.Output<R>, ParseIssue, R2>
  ): Route.UpdateSchema<R, Schema.transformOrFail<Route.Schema<R>, S, R2>>
} = dual(4, function transformOrFail<R extends Route.Any, S extends Schema.Schema.Any, R2>(
  route: R,
  toSchema: S,
  from: (o: Route.Output<R>) => Effect.Effect<Schema.Schema.Encoded<S>, ParseIssue, R2>,
  to: (s: Schema.Schema.Encoded<S>) => Effect.Effect<Route.Output<R>, ParseIssue, R2>
): Route.UpdateSchema<R, Schema.transformOrFail<Route.Schema<R>, S, R2>> {
  return schema(route as any, Schema.transformOrFail(route.schema, toSchema, from, to) as any) as any
})
