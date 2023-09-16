/**
 * Contextual wrappers around @effect/io/Request
 * @since 1.0.0
 */

/* eslint-disable @typescript-eslint/no-unused-vars */
import type * as Data from "@effect/data/Data"
import type { Effect } from "@effect/io/Effect"
import * as R from "@effect/io/Request"

import { Fn } from "./Fn"
import type { IdentifierFactory, IdentifierOf } from "./Identifier"

/**
 * Contextual wrappers around @effect/io/Request
 * @since 1.0.0
 */
export interface Request<I, Input, Req extends R.Request<any, any>>
  extends Fn<I, (requests: Req) => Effect<never, R.Request.Error<Req>, R.Request.Success<Req>>>
{
  readonly make: (
    ...input: SimplifyInputArg<Input>
  ) => Effect<I, R.Request.Error<Req>, R.Request.Success<Req>>
}

type Compact<Input> = [{ [K in keyof Input]: Input[K] }] extends [infer R] ? R : never

type SimplifyInputArg<Input> = [keyof Input] extends [never] ? [Compact<Input>?] : [Compact<Input>]

/**
 * Construct a Request implementation to be utilized from the Effect Context.
 * @since 1.0.0
 */
export function Request<
  const Id extends IdentifierFactory<any>,
  Input,
  Req extends R.Request<any, any>
>(id: Id, makeRequest: (input: Input) => Req): Request<IdentifierOf<Id>, Input, Req>

export function Request<const Id, Input, Req extends R.Request<any, any>>(
  id: Id,
  makeRequest: (input: Input) => Req
): Request<IdentifierOf<Id>, Input, Req>

export function Request<const Id, Input, Req extends R.Request<any, any>>(
  id: Id,
  makeRequest: (input: Input) => Req
): Request<IdentifierOf<Id>, Input, Req> {
  const fn = Fn<(req: Req) => Effect<never, R.Request.Error<Req>, R.Request.Success<Req>>>()(id)

  return Object.assign(fn, {
    make: (...[input]: SimplifyInputArg<Input>) => fn.apply(makeRequest((input || {}) as Input))
  })
}

/**
 * @since 1.0.0
 */
export namespace Request {
  /**
   * Extract the Identifier of a Request
   * @since 1.0.0
   */
  export type Identifier<T> = T extends Request<infer Id, infer _, infer __> ? Id : never

  /**
   * Extract the Input of a Request
   * @since 1.0.0
   */
  export type Input<T> = T extends Request<infer _, infer Input, infer __> ? Input : never

  /**
   * Extract the Request of a Request
   * @since 1.0.0
   */
  export type Req<T> = T extends Request<infer _, infer __, infer Req> ? Req : never

  /**
   * Extract the Error of a Request
   * @since 1.0.0
   */
  export type Error<T> = R.Request.Error<Req<T>>

  /**
   * Extract the Success of a Request
   * @since 1.0.0
   */
  export type Success<T> = R.Request.Success<Req<T>>

  /**
   * Extract the InputArg of a Request
   * @since 1.0.0
   */
  export type InputArg<T> = [keyof Input<T>] extends [never] ? [Input<T>?] : [Input<T>]

  /**
   * Construct a tagged Request implementation to be utilized from the Effect Context.
   * @since 1.0.0
   */
  export function tagged<Req extends R.Request<any, any> & { readonly _tag: string }>(
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
    return <const Id>(id: Id) => Request(id, R.tagged(tag)) as any
  }

  /**
   * Construct a Request implementation to be utilized from the Effect Context.
   * @since 1.0.0
   */
  export function of<Req extends R.Request<any, any>>(): {
    <const Id extends IdentifierFactory<any>>(
      id: Id
    ): Request<IdentifierOf<Id>, Compact<Omit<Req, R.RequestTypeId | keyof Data.Case>>, Req>

    <const Id>(
      id: Id
    ): Request<IdentifierOf<Id>, Compact<Omit<Req, R.RequestTypeId | keyof Data.Case>>, Req>
  } {
    return <const Id>(id: Id) => Request(id, R.of()) as any
  }
}
