import { Cause } from './Cause.js'
import { Finalizer } from './Finalizer.js'
import { Handler } from './Handler.js'
import { Instruction } from './Instruction.js'
import { Stack } from './Stack.js'

export type HandlerFrame =
  | MapFrame
  | FlatMapFrame
  | FlatMapCauseFrame
  | EffectHandlerFrame
  | FinalizerFrame

export class MapFrame {
  readonly _tag = 'MapFrame' as const
  constructor(readonly f: <A, B>(value: A) => B) {}
}

export class FlatMapFrame {
  readonly _tag = 'FlatMapFrame' as const
  constructor(readonly f: <A>(value: A) => Instruction) {}
}

export class FlatMapCauseFrame {
  readonly _tag = 'FlatMapCauseFrame' as const
  constructor(readonly f: <E>(cause: Cause<E>) => Instruction) {}
}

export class EffectHandlerFrame {
  readonly _tag = 'EffectHandlerFrame' as const
  constructor(readonly handler: Handler.Any) {}
}

export class FinalizerFrame {
  readonly _tag = 'FinalizerFrame' as const
  constructor(readonly finalizer: Finalizer) {}
}

export type StackFrames = Stack<HandlerFrame> | null
