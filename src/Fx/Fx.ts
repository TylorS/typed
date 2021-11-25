import { IOEither } from 'fp-ts/IOEither'
import { Reader } from 'fp-ts/Reader'

import { AsyncEither } from '@/AsyncEither'
import { Exit } from '@/Exit'

export interface Fx<R, E, A> {
  readonly [Symbol.iterator]: () => Generator<Instruction<R, E, any>, A>
}

export interface Of<A> extends Fx<unknown, never, A> {}
export interface EFx<E, A> extends Fx<unknown, E, A> {}
export interface RFx<R, A> extends Fx<R, never, A> {}

export type Instruction<R, E, A> = Reader<
  R,
  GetContext | FromExit<E, A> | FromIOEither<E, A> | FromAsyncEither<E, A>
>

export interface GetContext {
  readonly type: 'GetContext'
}

export interface FromExit<E, A> {
  readonly type: 'FromExit'
  readonly exit: Exit<E, A>
}

export interface FromIOEither<E, A> {
  readonly type: 'FromIOEither'
  readonly ioEither: IOEither<E, A>
}

export interface FromAsyncEither<E, A> {
  readonly type: 'FromAsyncEither'
  readonly asyncEither: AsyncEither<E, A>
}
