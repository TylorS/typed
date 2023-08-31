/* eslint-disable @typescript-eslint/no-unused-vars */
import * as Data from '@effect/data/Data'
import { Effect } from '@effect/io/Effect'
import * as R from '@effect/io/Request'

import { Fn } from './fn.js'
import { IdentifierOf } from './identifier.js'

export interface Request<I, Input, Req extends R.Request<any, any>>
  extends Fn<I, (requests: Req) => Effect<never, R.Request.Error<Req>, R.Request.Success<Req>>> {
  readonly make: (
    ...input: SimplifyInputArg<Input>
  ) => Effect<I, R.Request.Error<Req>, R.Request.Success<Req>>
}

type Compact<Input> = [{ [K in keyof Input]: Input[K] }] extends [infer R] ? R : never

type SimplifyInputArg<Input> = [keyof Input] extends [never] ? [Compact<Input>?] : [Compact<Input>]

export function Request<const Id, Input, Req extends R.Request<any, any>>(
  id: Id,
  makeRequest: (input: Input) => Req,
): Request<IdentifierOf<Id>, Input, Req> {
  const fn = Fn<(req: Req) => Effect<never, R.Request.Error<Req>, R.Request.Success<Req>>>()(id)

  return Object.assign(fn, {
    make: (...[input]: SimplifyInputArg<Input>) => fn.apply(makeRequest((input || {}) as Input)),
  })
}

export namespace Request {
  export type Identifier<T> = T extends Request<infer Id, infer _, infer __> ? Id : never
  export type Input<T> = T extends Request<infer _, infer Input, infer __> ? Input : never
  export type Req<T> = T extends Request<infer _, infer __, infer Req> ? Req : never
  export type Error<T> = R.Request.Error<Req<T>>
  export type Success<T> = R.Request.Success<Req<T>>

  export type InputArg<T> = [keyof Input<T>] extends [never] ? [Input<T>?] : [Input<T>]

  export function tagged<Req extends R.Request<any, any> & { readonly _tag: string }>(
    tag: Req['_tag'],
  ): <const Id>(
    id: Id,
  ) => Request<
    IdentifierOf<Id>,
    Compact<Omit<Req, R.RequestTypeId | '_tag' | keyof Data.Case>>,
    Req
  > {
    return <const Id>(id: Id) => Request(id, R.tagged(tag)) as any
  }

  export function of<Req extends R.Request<any, any>>(): <const Id>(
    id: Id,
  ) => Request<IdentifierOf<Id>, Compact<Omit<Req, R.RequestTypeId | keyof Data.Case>>, Req> {
    return <const Id>(id: Id) => Request(id, R.of()) as any
  }
}
