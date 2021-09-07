import { Either } from 'fp-ts/Either'
import { IOEither } from 'fp-ts/IOEither'
import { ReaderEither } from 'fp-ts/ReaderEither'
import { ReaderTaskEither } from 'fp-ts/ReaderTaskEither'

import { Async } from '@/Async'
import { Cause } from '@/Cause'
import { instr } from '@/internal'

import type { Fx } from './Fx'

export type Effects<R, E, A> =
  | EitherInstruction<E, A>
  | IOEitherInstruction<E, A>
  | PromiseInstruction<A>
  | ReaderEitherInstruction<R, E, A>
  | ReaderTaskEitherInstruction<R, E, A>
  | AsyncInstruction<R, E, A>
  | CauseInstruction<E>
  | ProvideInstruction<unknown, R, E, A>

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
  constructor(readonly requirements: R1, readonly fx: Fx<R1 & R2, E, A>) {
    super()
  }
}
