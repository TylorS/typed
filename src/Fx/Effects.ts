import { Either } from 'fp-ts/Either'
import { IOEither } from 'fp-ts/IOEither'
import { ReaderEither } from 'fp-ts/ReaderEither'
import { ReaderTaskEither } from 'fp-ts/ReaderTaskEither'

import { Async } from '@/Async'
import { Cause } from '@/Cause'
import { instr } from '@/internal'

import type * as Fx from './Fx'

export type Effects<R, E, A> =
  | EitherInstruction<E, A>
  | IOEitherInstruction<E, A>
  | PromiseInstruction<A>
  | ReaderEitherInstruction<R, E, A>
  | ReaderTaskEitherInstruction<R, E, A>
  | AsyncInstruction<R, E, A>
  | CauseInstruction<E>
  | ProvideInstruction<unknown, R, E, A>
  | ZipInstruction<ReadonlyArray<Fx.Fx<R, E, A>>>
  | RaceInstruction<readonly [Fx.Fx<R, E, A>, ...Array<Fx.Fx<R, E, A>>]>
  | OrElseInstruction<R, any, A, R, E, A>

export class EitherInstruction<E, A> extends instr('Either')<unknown, E, A> {
  constructor(readonly effect: Either<E, A>) {
    super()
  }
}

export class IOEitherInstruction<E, A> extends instr('IOEither')<unknown, E, A> {
  constructor(readonly effect: IOEither<E, A>) {
    super()
  }
}

export class PromiseInstruction<A> extends instr('PromiseInstruction')<unknown, never, A> {
  constructor(readonly effect: () => Promise<A>) {
    super()
  }
}

export class ReaderEitherInstruction<R, E, A> extends instr('ReaderEither')<R, E, A> {
  constructor(readonly effect: ReaderEither<R, E, A>) {
    super()
  }
}

export class ReaderTaskEitherInstruction<R, E, A> extends instr('ReaderTaskEither')<R, E, A> {
  constructor(readonly effect: ReaderTaskEither<R, E, A>) {
    super()
  }
}

export class AsyncInstruction<R, E, A> extends instr('Async')<R, E, A> {
  constructor(readonly effect: Async<R, E, A>) {
    super()
  }
}

export class CauseInstruction<E> extends instr('Cause')<unknown, E, never> {
  constructor(readonly effect: Cause<E>) {
    super()
  }
}

export class ProvideInstruction<R1, R2, E, A> extends instr('Provide')<R2, E, A> {
  constructor(readonly requirements: R1, readonly fx: Fx.Fx<R1 & R2, E, A>) {
    super()
  }
}

export class ZipInstruction<Fxs extends ReadonlyArray<Fx.Fx<any, any, any>>> extends instr('Zip')<
  Fx.RequirementsOf<Fxs[number]>,
  Fx.ErrorOf<Fxs[number]>,
  { [K in keyof Fxs]: Fx.ValueOf<Fxs[K]> }
> {
  constructor(readonly fxs: Fxs) {
    super()
  }
}

export class RaceInstruction<
  Fxs extends readonly [Fx.Fx<any, any, any>, ...ReadonlyArray<Fx.Fx<any, any, any>>],
> extends instr('Race')<
  Fx.RequirementsOf<Fxs[number]>,
  Fx.ErrorOf<Fxs[number]>,
  Fx.ValueOf<Fxs[number]>
> {
  constructor(readonly fxs: Fxs) {
    super()
  }
}

export class OrElseInstruction<R1, E1, A, R2, E2, B> extends instr('OrElse')<R1 & R2, E2, A | B> {
  constructor(readonly fx: Fx.Fx<R1, E1, A>, readonly orElse: (e: E1) => Fx.Fx<R2, E2, B>) {
    super()
  }
}
