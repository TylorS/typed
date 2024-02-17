/**
 * Contextual wrappers around @effect/io/RequestResolver
 * @since 1.0.0
 */

import * as Effect from "effect/Effect"
import * as Layer from "effect/Layer"
import type * as Req from "effect/Request"
import * as RR from "effect/RequestResolver"

import type { Context } from "./Context.js"
import { withActions } from "./Extensions.js"
import type { IdentifierFactory, IdentifierOf } from "./Identifier.js"
import type { Request } from "./Request.js"
import { Tag } from "./Tag.js"

/**
 * Contextual wrappers around @effect/io/RequestResolver
 * @since 1.0.0
 * @category models
 */
export interface RequestResolver<
  Id,
  Requests extends Readonly<Record<string, Request<any, any, any>>>
> extends Tag<Id, RR.RequestResolver<Request.Req<Requests[keyof Requests]>>> {
  readonly requests: Compact<DerivedRequests<Id, Requests>>

  readonly fromFunction: (
    f: (req: Request.Req<Requests[keyof Requests]>) => Request.Success<Requests[keyof Requests]>
  ) => Layer.Layer<Id | Request.Identifier<Requests[keyof Requests]>>

  readonly fromFunctionBatched: (
    f: (
      reqs: Array<Request.Req<Requests[keyof Requests]>>
    ) => Array<Request.Success<Requests[keyof Requests]>>
  ) => Layer.Layer<Id | Request.Identifier<Requests[keyof Requests]>>

  readonly make: <R>(
    f: (req: Array<Array<Request.Req<Requests[keyof Requests]>>>) => Effect.Effect<void, never, R>
  ) => Layer.Layer<Id, never, R>

  readonly makeBatched: <R>(
    f: (req: Array<Request.Req<Requests[keyof Requests]>>) => Effect.Effect<void, never, R>
  ) => Layer.Layer<Id | Request.Identifier<Requests[keyof Requests]>, never, R>

  readonly makeWithEntry: <R>(
    f: (
      req: Array<Array<Req.Entry<Request.Req<Requests[keyof Requests]>>>>
    ) => Effect.Effect<void, never, R>
  ) => Layer.Layer<Id | Request.Identifier<Requests[keyof Requests]>, never, R>
}

type DerivedRequests<Id, Reqs extends Readonly<Record<string, Request<any, any, any>>>> = {
  readonly [K in keyof Reqs]: (
    ...input: Request.InputArg<Reqs[K]>
  ) => Effect.Effect<Request.Success<Reqs[K]>, Request.Error<Reqs[K]>, Id>
}

type Compact<Input> = [{ [K in keyof Input]: Input[K] }] extends [infer R] ? R : never

/**
 * Construct a RequestResolver implementation to be utilized from the Effect Context.
 * @since 1.0.0
 * @category constructors
 */
export function RequestResolver<
  const Requests extends Readonly<Record<string, Request<any, any, any>>>
>(requests: Requests): {
  <const Id extends IdentifierFactory<any>>(id: Id): RequestResolver<IdentifierOf<Id>, Requests>
  <const Id>(id: Id): RequestResolver<IdentifierOf<Id>, Requests>
} {
  function makeRequestResolver<const Id extends IdentifierFactory<any>>(
    id: Id
  ): RequestResolver<IdentifierOf<Id>, Requests>
  function makeRequestResolver<const Id>(id: Id): RequestResolver<IdentifierOf<Id>, Requests>
  function makeRequestResolver<const Id>(id: Id): RequestResolver<IdentifierOf<Id>, Requests> {
    type _Req = Request.Req<Requests[keyof Requests]>
    type _Resolver = RequestResolver<IdentifierOf<Id>, Requests>

    const tag = withActions(Tag<Id, RR.RequestResolver<_Req>>(id))

    const [first, ...rest] = Object.values(requests).map((r) =>
      r.implement((req: _Req) => tag.withEffect((resolver) => Effect.request(req, resolver)))
    )
    const requestLayer = Layer.mergeAll(first, ...rest) as Layer.Layer<
      Request.Identifier<Requests[keyof Requests]>,
      never,
      IdentifierOf<Id>
    >
    const provideMerge = <R>(resolverLayer: Layer.Layer<IdentifierOf<Id>, never, R>) =>
      Layer.provideMerge(requestLayer, resolverLayer)

    const derivedRequests = Object.fromEntries(
      Object.entries(requests).map(
        ([k, v]) => [k, (input: any) => Effect.provide(v.make(input), requestLayer)] as const
      )
    ) as _Resolver["requests"]

    const fromFunction: _Resolver["fromFunction"] = (f) => provideMerge(Layer.succeed(tag, RR.fromFunction(f)))

    const fromFunctionBatched: _Resolver["fromFunctionBatched"] = (f) =>
      provideMerge(Layer.succeed(tag, RR.fromFunctionBatched(f)))

    const layerWithContext = <R = never>(f: () => RR.RequestResolver<_Req, R>) =>
      provideMerge(Layer.effect(tag, Effect.contextWith((ctx: Context<R>) => RR.provideContext(f(), ctx))))

    const make: _Resolver["make"] = (f) => layerWithContext(() => RR.make(f))

    const makeBatched: _Resolver["makeBatched"] = (f) => layerWithContext(() => RR.makeBatched(f))

    const makeWithEntry: _Resolver["makeWithEntry"] = (f) => layerWithContext(() => RR.makeWithEntry(f))

    const resolver: RequestResolver<IdentifierOf<Id>, Requests> = Object.assign(tag, {
      requests: derivedRequests,
      fromFunction,
      fromFunctionBatched,
      make,
      makeBatched,
      makeWithEntry
    })

    return resolver
  }

  return makeRequestResolver
}

/**
 * @since 1.0.0
 */
export namespace RequestResolver {
  /**
   * Extract the Identifier of a RequestResolver
   * @since 1.0.0
   * @category type-level
   */
  export type Identifier<T> = T extends RequestResolver<infer Id, infer _> ? Id : never

  /**
   * Extract the Requests of a RequestResolver
   * @since 1.0.0
   * @category type-level
   */
  export type Requests<T> = T extends RequestResolver<infer _, infer Requests> ? Requests : never

  /**
   * Extract the Identifiers of a RequestResolver
   * @since 1.0.0
   * @category type-level
   */
  export type Identifiers<T> = Identifier<T> | Request.Identifier<Requests<T>>

  /**
   * Extract the RequestResolver
   * @since 1.0.0
   * @category type-level
   */
  export type Resolver<T> = RR.RequestResolver<Request.Req<Requests<T>[keyof Requests<T>]>, Identifiers<T>>
}
