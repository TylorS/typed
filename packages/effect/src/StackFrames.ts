import { Cause } from './Cause.js'
import { Handler } from './Handler.js'
import { Instruction } from './Instruction.js'
import { Stack } from './Stack.js'

export type HandlerFrame = MapFrame | FlatMapFrame | FlatMapCauseFrame | EffectHandlerFrame

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

export type StackFrames = Stack<HandlerFrame> | null
