import { IO } from 'fp-ts/IO'

import { Async } from '@/Async'
import { Exit } from '@/Exit'

import { Scope } from './Scope'

export interface Fx<R, E, A> {
  readonly [Symbol.iterator]: () => Generator<Instruction<R, E, any>, A>
}

export type Instruction<R, E, A> =
  | Access<R, R, E, A>
  | FromExit<E, A>
  | Success<A>
  | FromIO<A>
  | FromPromise<A>
  | FromAsync<A>
  | Fold<R, E, any, R, E, A, R, E, A>
  | FlatMap<R, E, any, R, E, A>
  | Parallel<ReadonlyArray<Fx<R, E, any>>>
  | Race<ReadonlyArray<Fx<R, E, any>>>

abstract class BaseFx<Type extends string, R, E, A> {
  readonly _R!: (r: R) => void
  readonly _E!: () => E
  readonly _A!: () => A

  constructor(readonly type: Type) {}
}

export class Access<R1, R2, E, A> extends BaseFx<'Access', R1 & R2, E, A> {
  constructor(readonly access: (r1: R1) => Fx<R2, E, A>) {
    super('Access')
  }
}

export class FromExit<E, A> extends BaseFx<'FromExit', unknown, E, A> {
  constructor(readonly exit: Exit<E, A>) {
    super('FromExit')
  }
}

export class Success<A> extends BaseFx<'Success', unknown, never, A> {
  constructor(readonly value: A) {
    super('Success')
  }
}

export class FromPromise<A> extends BaseFx<'FromPromise', unknown, never, A> {
  constructor(readonly promise: () => Promise<A>) {
    super('FromPromise')
  }
}

export class FromAsync<A> extends BaseFx<'FromAsync', unknown, never, A> {
  constructor(readonly async: Async<A>) {
    super('FromAsync')
  }
}

export class FromIO<A> extends BaseFx<'FromIO', unknown, never, A> {
  constructor(readonly io: IO<A>) {
    super('FromIO')
  }
}

export class Fold<R1, E1, A1, R2, E2, A2, R3, E3, A3> extends BaseFx<
  'Fold',
  R1 & R2 & R3,
  E1 | E2 | E3,
  A2 | A3
> {
  constructor(
    readonly fx: Fx<R1, E1, A1>,
    readonly onLeft: (cause: E1) => Fx<R2, E2, A2>,
    readonly onRight: (value: A1) => Fx<R3, E3, A3>,
  ) {
    super('Fold')
  }
}

export class FlatMap<R1, E1, A1, R2, E2, A2> extends BaseFx<'FlatMap', R1 & R2, E1 | E2, A2> {
  constructor(readonly fx: Fx<R1, E1, A1>, readonly f: (value: A1) => Fx<R2, E2, A2>) {
    super('FlatMap')
  }
}

export class Parallel<FXS extends ReadonlyArray<Fx<any, any, any>>> extends BaseFx<
  'Parallel',
  RequirementsOf<FXS[number]>,
  ErrorOf<FXS[number]>,
  {
    readonly [K in keyof FXS]: OutputOf<FXS[K]>
  }
> {
  fxs: FXS
  constructor(...fxs: FXS) {
    super('Parallel')
    this.fxs = fxs
  }
}

export class Race<FXS extends ReadonlyArray<Fx<any, any, any>>> extends BaseFx<
  'Race',
  RequirementsOf<FXS[number]>,
  ErrorOf<FXS[number]>,
  OutputOf<FXS[number]>
> {
  readonly fxs: FXS
  constructor(...fxs: FXS) {
    super('Race')
    this.fxs = fxs
  }
}

export class Fork<R, E, A> {
  constructor(readonly fx: Fx<R, E, A>, readonly requirements: R, readonly scope: Scope) {}
}

export type RequirementsOf<T> = T extends Fx<infer R, any, any> ? R : unknown

export type ErrorOf<T> = T extends Fx<any, infer E, any> ? E : never

export type OutputOf<T> = T extends Fx<any, any, infer A> ? A : never

export function Fx<G extends Generator<Instruction<any, any, any>, any>>(
  generatorFunction: () => G,
): FxOf<G> {
  return {
    [Symbol.iterator]: generatorFunction,
  } as unknown as FxOf<G>
}

export type FxOf<G> = G extends Fx<infer R, infer E, infer A>
  ? Fx<R, E, A>
  : G extends (...args: readonly any[]) => infer R
  ? FxOf<R>
  : never

export function fromInstruction<R = unknown, E = never, A = never>(
  instruction: Instruction<R, E, A>,
): Fx<R, E, A> {
  return Fx(function* () {
    const a = yield instruction

    return a as A
  })
}
