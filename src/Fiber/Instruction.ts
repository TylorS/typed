import { Disposable } from '@/Disposable'
import { Fx } from '@/Fx'
import { instr } from '@/internal'

import { Fiber } from './Fiber'

export type FiberInstruction<R, E, A> =
  | ForkInstruction<R, E, A>
  | JoinInstruction<unknown, E, A>
  | DisposableInstruction<any>
  | InterruptableStatusInstruction

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

export class DisposableInstruction<A> extends instr('Disposable')<
  unknown,
  never,
  Disposable<void>
> {
  constructor(readonly disposable: Disposable<A>) {
    super()
  }
}

export class InterruptableStatusInstruction extends instr('InterruptibleStatus')<
  unknown,
  never,
  boolean
> {
  constructor(readonly isInterruptible: boolean) {
    super()
  }
}
