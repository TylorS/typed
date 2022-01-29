import { unsafeCoerce } from 'fp-ts/function'

import { Branded } from '@/Branded'

/**
 * A Service is a unique symbol branded with its name and the implementation of that Service A.
 */
export type Service<Name extends string, A> = Branded<
  symbol,
  { readonly Service: A; readonly ServiceName: Name }
>

export type NameOf<T> = [T] extends [Service<infer A, infer _>] ? A : never
export type ServiceOf<T> = [T] extends [Service<infer _, infer A>] ? A : never

/**
 * Constructs a Service
 * @example
 *
 * const Fetch = Service<(request: Request) => Fx.Of<Response>>()('Fetch')
 */
export const make =
  <A>() =>
  <Name extends string>(name: Name): Service<Name, A> =>
    unsafeCoerce(Symbol(name))
