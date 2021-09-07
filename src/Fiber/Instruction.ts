import { Disposable } from '@/Disposable'
import { Fx } from '@/Fx'
import { instr } from '@/internal'

import { Fiber } from './Fiber'

export type FiberInstruction<R, E, A> =
  | ForkInstruction<R, E, A>
  | JoinInstruction<unknown, E, A>
  | SuspendInstruction<E, A>
  | DisposableInstruction

export class ForkInstruction<R, E, A> extends instr('Fork')<R, never, Fiber<R, E, A>> {
  constructor(readonly fx: Fx<R, E, A>) {
    super()
  }
}

export class JoinInstruction<R, E, A> extends instr('Join')<unknown, E, A> {
  constructor(readonly fiber: Fiber<R, E, A>) {
    super()
  }
}

export class SuspendInstruction<E, A> extends instr('Suspend')<unknown, E, A> {
  constructor(readonly resume: (cb: (value: A) => void) => Disposable) {
    super()
  }
}

export class DisposableInstruction extends instr('Disposable')<unknown, never, Disposable> {
  constructor(readonly disposable: Disposable) {
    super()
  }
}
