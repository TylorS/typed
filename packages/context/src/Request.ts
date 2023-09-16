/**
 * Contextual wrappers around @effect/io/Request
 * @since 1.0.0
 */

/* eslint-disable @typescript-eslint/no-unused-vars */
import type * as Data from "@effect/data/Data"
import type { Effect } from "@effect/io/Effect"
import * as R from "@effect/io/Request"

import { Fn } from "@typed/context/Fn"
import type { IdentifierFactory, IdentifierInput, IdentifierOf } from "@typed/context/Identifier"

/**
 * Contextual wrappers around @effect/io/Request
 * @since 1.0.0
 * @category models
 */
export interface Request<I, Input, Req extends R.Request<any, any>>
  extends Fn<I, (requests: Req) => Effect<never, R.Request.Error<Req>, R.Request.Success<Req>>>
{
  /**
   * Make the request using the provided impleemtation from the Effect Context.
   * @since 1.0.0
   */
  readonly make: (
    ...input: SimplifyInputArg<Input>
  ) => Effect<I, R.Request.Error<Req>, R.Request.Success<Req>>
}

type Compact<Input> = [{ [K in keyof Input]: Input[K] }] extends [infer R] ? R : never

type SimplifyInputArg<Input> = [keyof Input] extends [never] ? [Compact<Input>?] : [Compact<Input>]

/**
 * Construct a Request implementation to be utilized from the Effect Context.
 * @since 1.0.0
 * @category constructors
 */
export interface RequestConstructor {
  <Input, Req extends R.Request<any, any>>(
    makeRequest: (input: Input) => Req
  ): {
    <const Id extends IdentifierFactory<any>>(id: Id): Request<IdentifierOf<Id>, Input, Req>
    <const Id>(id: Id): Request<IdentifierOf<Id>, Input, Req>
  }

  /**
   * Construct a tagged Request implementation to be utilized from the Effect Context.
   * @since 1.0.0
   * @category constructors
   */
  readonly tagged: <Req extends R.Request<any, any> & { readonly _tag: string }>(
    tag: Req["_tag"]
  ) => {
    <const Id extends IdentifierFactory<any>>(
      id: Id
    ): Request<IdentifierOf<Id>, Compact<Omit<Req, "_tag" | typeof R.RequestTypeId | keyof Data.Case>>, Req>
    <const Id>(
      id: Id
    ): Request<IdentifierOf<Id>, Compact<Omit<Req, "_tag" | typeof R.RequestTypeId | keyof Data.Case>>, Req>
  }
  /**
   * Construct a Request implementation to be utilized from the Effect Context.
   * @since 1.0.0
   * @category constructors
   */
  readonly of: <Req extends R.Request<any, any>>() => {
    <const Id extends IdentifierFactory<any>>(
      id: Id
    ): Request<IdentifierOf<Id>, Compact<Omit<Req, typeof R.RequestTypeId | keyof Data.Case>>, Req>
    <const Id>(id: Id): Request<IdentifierOf<Id>, Compact<Omit<Req, typeof R.RequestTypeId | keyof Data.Case>>, Req>
  }
}

/**
 * Construct a Request implementation to be utilized from the Effect Context.
 * @since 1.0.0
 * @category constructors
 */
export const Request: RequestConstructor = Object.assign(
  function Request<Input, Req extends R.Request<any, any>>(
    makeRequest: (input: Input) => Req
  ): {
    <const Id extends IdentifierFactory<any>>(id: Id): Request<IdentifierOf<Id>, Input, Req>
    <const Id>(id: Id): Request<IdentifierOf<Id>, Input, Req>
  } {
    return <Id>(id: IdentifierInput<Id>) => {
      const fn = Fn<(req: Req) => Effect<never, R.Request.Error<Req>, R.Request.Success<Req>>>()(id)

      return Object.assign(fn, {
        make: (...[input]: SimplifyInputArg<Input>) => fn.apply(makeRequest((input || {}) as Input))
      })
    }
  },
  {
    /**
     * Construct a tagged Request implementation to be utilized from the Effect Context.
     * @since 1.0.0
     * @category constructors
     */
    tagged: function tagged<Req extends R.Request<any, any> & { readonly _tag: string }>(
      tag: Req["_tag"]
    ): {
      <const Id extends IdentifierFactory<any>>(
        id: Id
      ): Request<
        IdentifierOf<Id>,
        Compact<Omit<Req, R.RequestTypeId | "_tag" | keyof Data.Case>>,
        Req
      >

      <const Id>(
        id: Id
      ): Request<
        IdentifierOf<Id>,
        Compact<Omit<Req, R.RequestTypeId | "_tag" | keyof Data.Case>>,
        Req
      >
    } {
      return Request(R.tagged(tag)) as any
    },

    /**
     * Construct a Request implementation to be utilized from the Effect Context.
     * @since 1.0.0
     * @category constructors
     */

    of: function of<Req extends R.Request<any, any>>(): {
      <const Id extends IdentifierFactory<any>>(
        id: Id
      ): Request<IdentifierOf<Id>, Compact<Omit<Req, R.RequestTypeId | keyof Data.Case>>, Req>

      <const Id>(
        id: Id
      ): Request<IdentifierOf<Id>, Compact<Omit<Req, R.RequestTypeId | keyof Data.Case>>, Req>
    } {
      return Request(R.of()) as any
    }
  } as const
)

/**
 * @since 1.0.0
 * @category constructors
 */
export namespace Request {
  /**
   * Extract the Identifier of a Request
   * @since 1.0.0
   * @category type-level
   */
  export type Identifier<T> = T extends Request<infer Id, infer _, infer __> ? Id : never

  /**
   * Extract the Input of a Request
   * @since 1.0.0
   * @category type-level
   */
  export type Input<T> = T extends Request<infer _, infer Input, infer __> ? Input : never

  /**
   * Extract the Request of a Request
   * @since 1.0.0
   * @category type-level
   */
  export type Req<T> = T extends Request<infer _, infer __, infer Req> ? Req : never

  /**
   * Extract the Error of a Request
   * @since 1.0.0
   * @category type-level
   */
  export type Error<T> = R.Request.Error<Req<T>>

  /**
   * Extract the Success of a Request
   * @since 1.0.0
   * @category type-level
   */
  export type Success<T> = R.Request.Success<Req<T>>

  /**
   * Extract the InputArg of a Request
   * @since 1.0.0
   * @category type-level
   */
  export type InputArg<T> = [keyof Input<T>] extends [never] ? [Input<T>?] : [Input<T>]
}
