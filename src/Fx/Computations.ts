import type { IO } from 'fp-ts/IO'

import type { Async } from '@/Async'
import type { Exit } from '@/Exit'

import { BaseFx } from './BaseFx'
import type { Fx, Of, OutputOf, RequirementsOf } from './Fx'
import { fromInstruction } from './Instruction'

/**
 * Fx Instruction-set for performing computations or returning their results.
 */
export type Computations<R, A> =
  | Access<R, R, A>
  | FromExit<A>
  | Success<A>
  | FromIO<A>
  | FromPromise<A>
  | FromAsync<A>
  | FlatMap<R, any, R, A>
  | Parallel<ReadonlyArray<Fx<R, any>>>
  | Race<ReadonlyArray<Fx<R, any>>>

export class Access<R1, R2, A> extends BaseFx<'Access', R1 & R2, A> {
  constructor(readonly access: (r1: R1) => Fx<R2, A>) {
    super('Access')
  }
}

export class FromExit<A> extends BaseFx<'FromExit', unknown, A> {
  constructor(readonly exit: Exit<A>) {
    super('FromExit')
  }
}

export class Success<A> extends BaseFx<'Success', unknown, A> {
  constructor(readonly value: A) {
    super('Success')
  }
}

export class FromPromise<A> extends BaseFx<'FromPromise', unknown, A> {
  constructor(readonly promise: () => Promise<A>) {
    super('FromPromise')
  }
}

export class FromAsync<A> extends BaseFx<'FromAsync', unknown, A> {
  constructor(readonly async: Async<A>) {
    super('FromAsync')
  }
}

export class FromIO<A> extends BaseFx<'FromIO', unknown, A> {
  constructor(readonly io: IO<A>) {
    super('FromIO')
  }
}

export class FlatMap<R1, A1, R2, A2> extends BaseFx<'FlatMap', R1 & R2, A2> {
  constructor(readonly fx: Fx<R1, A1>, readonly f: (value: A1) => Fx<R2, A2>) {
    super('FlatMap')
  }
}

export class Parallel<FXS extends ReadonlyArray<Fx<any, any>>> extends BaseFx<
  'Parallel',
  RequirementsOf<FXS[number]>,
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

export class Race<FXS extends ReadonlyArray<Fx<any, any>>> extends BaseFx<
  'Race',
  RequirementsOf<FXS[number]>,
  OutputOf<FXS[number]>
> {
  readonly fxs: FXS
  constructor(...fxs: FXS) {
    super('Race')
    this.fxs = fxs
  }
}

export function access<R1, R2, A>(access: Access<R1, R2, A>['access']): Fx<R1 & R2, A> {
  return fromInstruction(new Access(access))
}

export function fromExit<A>(exit: Exit<A>): Fx<unknown, A> {
  return fromInstruction(new FromExit(exit))
}

export function of<A>(value: A): Fx<unknown, A> {
  return fromInstruction(new Success(value))
}

export function fromIO<A>(io: IO<A>): Of<A> {
  return fromInstruction(new FromIO(io))
}

export function fromPromise<A>(promise: IO<Promise<A>>): Of<A> {
  return fromInstruction(new FromPromise(promise))
}

export function fromAsync<A>(async: Async<A>): Of<A> {
  return fromInstruction(new FromAsync(async))
}

export function flatMap<R2, A2, A1>(onRight: (value: A1) => Fx<R2, A2>) {
  return <R1, E1>(fx: Fx<R1, A1>): Fx<R1 & R2, E1 | A2> => fromInstruction(new FlatMap(fx, onRight))
}

export function zip<FXS extends ReadonlyArray<Fx<any, any>>>(
  ...fxs: FXS
): Fx<
  RequirementsOf<FXS[number]>,
  {
    readonly [K in keyof FXS]: OutputOf<FXS[K]>
  }
> {
  return fromInstruction(new Parallel(...(fxs as any))) as Fx<
    RequirementsOf<FXS[number]>,
    {
      readonly [K in keyof FXS]: OutputOf<FXS[K]>
    }
  >
}

export function race<FXS extends ReadonlyArray<Fx<any, any>>>(
  ...fxs: FXS
): Fx<RequirementsOf<FXS[number]>, OutputOf<FXS[number]>> {
  return fromInstruction(new Race(...(fxs as any))) as Fx<
    RequirementsOf<FXS[number]>,
    OutputOf<FXS[number]>
  >
}
