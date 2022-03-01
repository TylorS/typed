import { Exit } from '@/Exit'
import { Async } from '@/Prelude/Async'

export interface RuntimeIterable<E, A> {
  readonly [Symbol.iterator]: () => RuntimeGenerator<E, A>
}
export type RuntimeGenerator<E, A> = Generator<RuntimeInstruction<E>, A>

export type RuntimeInstruction<E> =
  | ResumeSync<any>
  | ResumeAsync<any>
  | ResumePromise<any>
  | ResumeExit<E, any>

export class ResumeSync<A> {
  readonly type = 'Sync'
  constructor(readonly value: A) {}
}

export class ResumePromise<A> {
  readonly type = 'Promise'
  constructor(readonly promise: () => Promise<A>) {}
}

export class ResumeAsync<A> {
  readonly type = 'Async'
  constructor(readonly async: Async<A>) {}
}

export class ResumeExit<E, A> {
  readonly type = 'Exit'
  constructor(readonly exit: Exit<E, A>) {}
}
