import { IO } from 'fp-ts/IO'

import type { Async } from '@/Async'
import type { Cause } from '@/Cause'
import type { Context } from '@/Context'
import { Disposable } from '@/Disposable'
import { effect, instr, InstrOf } from '@/Effect'
import { Fx } from '@/Fx'
import type { LocalScope, Scope } from '@/Scope'
import { Stream } from '@/Stream'

import type { Fiber } from './Fiber'

export type Instruction<R, A> =
  | GetContext
  | GetScope<R>
  | GetScope<unknown>
  | FromValue<A>
  | FromIO<A>
  | FromAsync<A>
  | FromPromise<A>
  | FromCause
  | Provide<unknown, A>
  | Suspend
  | Fork<R, any>
  | Fork<unknown, any>
  | Join<any>
  | Drain<R, any>
  | Drain<unknown, any>

export const getContext = instr<void, Context>()('GetContext')()
export type GetContext = InstrOf<typeof getContext>

export class GetScope<R> extends effect('GetScope')<void, Scope<R, any>> {}
export const getScope = <R>(): GetScope<R> => new GetScope<R>()

export class FromValue<A> extends effect('FromValue')<A, A> {}
export const fromValue = <A>(value: A): FromValue<A> => new FromValue(value)

export class FromIO<A> extends effect('FromIO')<IO<A>, A> {}
export const fromIO = <A>(io: IO<A>): FromIO<A> => new FromIO(io)

export class FromAsync<A> extends effect('FromAsync')<Async<A>, A> {}
export const fromAsync = <A>(async: Async<A>): FromAsync<A> => new FromAsync(async)

export class FromPromise<A> extends effect('FromPromise')<() => Promise<A>, A> {}
export const fromPromise = <A>(async: () => Promise<A>): FromPromise<A> => new FromPromise(async)

export const fromCause = instr<Cause, never>()('FromCause')
export type FromCause = InstrOf<typeof fromCause>

export class Provide<R, A> extends effect('Provide')<readonly [fx: Fx<R, A>, requirements: R], A> {}

export const provide =
  <R>(requirements: R) =>
  <A>(fx: Fx<R, A>): Provide<R, A> =>
    new Provide([fx, requirements])

export const suspend = instr<void, void>()('Suspend')()
export type Suspend = InstrOf<typeof suspend>

export interface ForkOptions<R, A> {
  readonly fx: Fx<R, A>
  readonly scope?: LocalScope<R, A>
  readonly context?: Context
  readonly inheritRefs?: boolean
}

export class Fork<R, A> extends effect('Fork')<ForkOptions<R, A>, Fiber<A>> {}
export const fork = <R, A>(fx: Fx<R, A>): Fork<R, A> => new Fork({ fx })

export class Join<A> extends effect('Join')<Fiber<A>, A> {}
export const join = <A>(fiber: Fiber<A>): Join<A> => new Join(fiber)

export class Drain<R, A> extends effect('Drain')<Stream<R, A>, Disposable> {}
export const drain = <R, A>(stream: Stream<R, A>): Drain<R, A> => new Drain(stream)
