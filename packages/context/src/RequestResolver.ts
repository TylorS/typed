/**
 * Contextual wrappers around @effect/io/RequestResolver
 * @since 1.0.0
 */

import * as Effect from "@effect/io/Effect"
import * as Layer from "@effect/io/Layer"
import type * as Req from "@effect/io/Request"
import * as RR from "@effect/io/RequestResolver"

import type { Context } from "@typed/context/Context"
import { withActions } from "@typed/context/Extensions"
import type { IdentifierFactory, IdentifierOf } from "@typed/context/Identifier"
import type { Request } from "@typed/context/Request"
import { Tag } from "@typed/context/Tag"

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
  ) => Layer.Layer<never, never, Id | Request.Identifier<Requests[keyof Requests]>>

  readonly fromFunctionBatched: (
    f: (
      reqs: Array<Request.Req<Requests[keyof Requests]>>
    ) => Array<Request.Success<Requests[keyof Requests]>>
  ) => Layer.Layer<never, never, Id | Request.Identifier<Requests[keyof Requests]>>

  readonly fromFunctionEffect: <R>(
    f: (
      req: Request.Req<Requests[keyof Requests]>
    ) => Effect.Effect<
      R,
      Request.Error<Requests[keyof Requests]>,
      Request.Success<Requests[keyof Requests]>
    >
  ) => Layer.Layer<R, never, Id | Request.Identifier<Requests[keyof Requests]>>

  readonly make: <R>(
    f: (req: Array<Array<Request.Req<Requests[keyof Requests]>>>) => Effect.Effect<R, never, void>
  ) => Layer.Layer<R, never, Id>

  readonly makeBatched: <R>(
    f: (req: Array<Request.Req<Requests[keyof Requests]>>) => Effect.Effect<R, never, void>
  ) => Layer.Layer<R, never, Id | Request.Identifier<Requests[keyof Requests]>>

  readonly makeWithEntry: <R>(
    f: (
      req: Array<Array<Req.Entry<Request.Req<Requests[keyof Requests]>>>>
    ) => Effect.Effect<R, never, void>
  ) => Layer.Layer<R, never, Id | Request.Identifier<Requests[keyof Requests]>>
}

type DerivedRequests<Id, Reqs extends Readonly<Record<string, Request<any, any, any>>>> = {
  readonly [K in keyof Reqs]: (
    ...input: Request.InputArg<Reqs[K]>
  ) => Effect.Effect<Id, Request.Error<Reqs[K]>, Request.Success<Reqs[K]>>
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
      IdentifierOf<Id>,
      never,
      Request.Identifier<Requests[keyof Requests]>
    >
    const provideMerge = <R>(resolverLayer: Layer.Layer<R, never, IdentifierOf<Id>>) =>
      Layer.provideMerge(resolverLayer, requestLayer)

    const derivedRequests = Object.fromEntries(
      Object.entries(requests).map(
        ([k, v]) => [k, (input: any) => Effect.provideSomeLayer(v.make(input), requestLayer)] as const
      )
    ) as _Resolver["requests"]

    const fromFunction: _Resolver["fromFunction"] = (f) => provideMerge(Layer.succeed(tag, RR.fromFunction(f)))

    const fromFunctionBatched: _Resolver["fromFunctionBatched"] = (f) =>
      provideMerge(Layer.succeed(tag, RR.fromFunctionBatched(f)))

    const layerWithContext = <R = never>(f: () => RR.RequestResolver<_Req, R>) =>
      provideMerge(Layer.effect(tag, Effect.contextWith((ctx: Context<R>) => RR.provideContext(f(), ctx))))

    const fromFunctionEffect: _Resolver["fromFunctionEffect"] = (f) => layerWithContext(() => RR.fromFunctionEffect(f))

    const make: _Resolver["make"] = (f) => layerWithContext(() => RR.make(f))

    const makeBatched: _Resolver["makeBatched"] = (f) => layerWithContext(() => RR.makeBatched(f))

    const makeWithEntry: _Resolver["makeWithEntry"] = (f) => layerWithContext(() => RR.makeWithEntry(f))

    const resolver: RequestResolver<IdentifierOf<Id>, Requests> = Object.assign(tag, {
      requests: derivedRequests,
      fromFunction,
      fromFunctionBatched,
      fromFunctionEffect,
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
