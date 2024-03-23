import { TreeFormatter } from "@effect/schema"
import type { ParseError, ParseIssue } from "@effect/schema/ParseResult"
import * as Schema from "@effect/schema/Schema"
import type { Guard } from "@typed/guard"
import type { NanoId } from "@typed/id/NanoId"
import * as ID from "@typed/id/Schema"
import type { Uuid } from "@typed/id/Uuid"
import type * as Path from "@typed/path"
import * as AST from "@typed/route/AST"
import type { Types } from "effect"
import { Data, Effect, ReadonlyRecord } from "effect"
import { dual } from "effect/Function"
import { type Pipeable, pipeArguments } from "effect/Pipeable"
import { unify } from "effect/Unify"
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
  export type Any = Route<any, any> | Route<never, any> | Route<any, never> | Route<never, never>

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
  export type Path<T> = T extends Route<infer P, infer _> ? P : never

  /**
   * @since 1.0.0
   */
  export type Schema<T> = [T] extends [never] ? never :
    T extends Route<infer _, infer S> ? [S] extends [never] ? SchemaFromPath<_> : S
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
export const lit = <const L extends string>(literal: L): Route<`/${L}`> => make(new AST.Literal(`/${literal}`))

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
export const RouteGuardTypeId = Symbol.for("@typed/route/RouteGuard")
/**
 * @since 1.0.0
 */
export type RouteGuardTypeId = typeof RouteGuardTypeId

/**
 * @since 1.0.0
 */
export interface RouteGuard<Route extends Route.Any, A, E, R> extends Guard<string, A, E, R> {
  readonly [RouteGuardTypeId]: RouteGuardTypeId
  readonly route: Route
  readonly path: Route.Path<Route>
  readonly schema: Route.Schema<Route>
  readonly guard: Guard<Route.Output<Route>, A, E, R>
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
      route: getPath(this.route),
      issue: TreeFormatter.formatIssue(this.issue)
    }
  }

  toString() {
    return `RouteDecodeError: ${getPath(this.route)} ${TreeFormatter.formatIssue(this.issue)}`
  }
}

/**
 * @since 1.0.0
 */
export function RouteGuard<Route extends Route.Any, A, E, R>(
  route: Route,
  guard: Guard<Route.Output<Route>, A, E, R>
): RouteGuard<Route, A, E | RouteDecodeError<Route>, Route.Context<Route> | R> {
  const path = getPath(route)
  const match = ptr.match(path, { end: path === "/" })
  const schema = getSchema(route)
  const decode: (u: unknown) => Effect.Effect<Route.Output<Route>, ParseError, Route.Context<Route>> = Schema
    .decodeUnknown(schema)
  const routeGuard = unify((input: string) => {
    const matched = match(input)
    if (matched === false) {
      return Effect.succeedNone
    } else {
      return Effect.matchEffect(decode(matched.params), {
        onFailure: (issue) => new RouteDecodeError({ route, issue: issue.error }),
        onSuccess: guard
      })
    }
  })

  return Object.assign(
    routeGuard,
    {
      [RouteGuardTypeId]: RouteGuardTypeId,
      route,
      path,
      schema,
      guard
    } as const
  )
}

/**
 * @since 1.0.0
 */
export const guard: {
  <Route extends Route.Any, A, E, R>(
    guard: Guard<Route.Output<Route>, A, E, R>
  ): (route: Route) => RouteGuard<Route, A, RouteDecodeError<Route> | E, R | Route.Context<Route>>

  <Route extends Route.Any, A, E, R>(
    route: Route,
    guard: Guard<Route.Output<Route>, A, E, R>
  ): RouteGuard<Route, A, RouteDecodeError<Route> | E, R | Route.Context<Route>>
} = dual(2, <Route extends Route.Any, A, E, R>(
  route: Route,
  guard: Guard<Route.Output<Route>, A, E, R>
): RouteGuard<Route, A, E | RouteDecodeError<Route>, R | Route.Context<Route>> => RouteGuard(route, guard))
