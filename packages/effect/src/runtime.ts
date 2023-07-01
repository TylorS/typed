import { Effect } from './Effect.js'
import * as Exit from './Exit.js'
import { Handler } from './Handler.js'
import * as Instruction from './Instruction.js'
import { Op } from './Op.js'
import { Stack } from './Stack.js'

export type HandlerFrame = ControlFlowFrame | EffectHandlerFrame

export class ControlFlowFrame {
  readonly _tag = 'ControlFlowFrame' as const
  constructor(readonly f: <A>(value: A) => Instruction.Instruction) {}
}

export class EffectHandlerFrame {
  readonly _tag = 'EffectHandlerFrame' as const
  constructor(readonly handler: Handler.Any) {}
}

type StackFrames = Stack<HandlerFrame> | null

export class Handlers {
  constructor(private map: globalThis.Map<Op.Any, Stack<Handler.Any>> = new globalThis.Map()) {}

  clone(): Handlers {
    return new Handlers(new globalThis.Map(this.map))
  }

  push(handler: Handler.Any) {
    const handlers = this.map.get(handler.op)

    if (handlers) {
      this.map.set(handler.op, new Stack(handler, handlers))
    } else {
      this.map.set(handler.op, new Stack(handler, null))
    }
  }

  pop(handler: Handler.Any) {
    const handlers = this.map.get(handler.op)

    if (handlers) {
      const current = handlers.value

      if (handlers.previous) {
        this.map.set(handler.op, handlers.previous)
      } else {
        this.map.delete(handler.op)
      }

      return current
    }

    return null
  }

  find(op: Op.Any) {
    const current = this.map.get(op)

    if (current) {
      return current.value
    }

    return null
  }
}

export class Observers<A> {
  private observers = new globalThis.Set<(exit: Exit.Exit<never, A>) => void>()

  add(observer: (exit: Exit.Exit<never, A>) => void) {
    this.observers.add(observer)

    return () => {
      this.observers.delete(observer)
    }
  }

  notify(exit: Exit.Exit<never, A>) {
    if (this.observers.size === 0) return

    this.observers.forEach((observer) => observer(exit))
    this.observers.clear()
  }
}

export class Executor<R, A> {
  private _started = false
  private _instruction: Instruction.Instruction | null = null
  private _frames: StackFrames = null
  private _observers = new Observers<A>()

  constructor(readonly effect: Effect<R, A>, readonly handlers: Handlers = new Handlers()) {
    this._instruction = effect as Instruction.Instruction
  }

  start() {
    if (this._started) return false

    this.process()

    return true
  }

  addObserver(observer: (exit: Exit.Exit<never, A>) => void) {
    return this._observers.add(observer)
  }

  private process() {
    while (this._instruction !== null) {
      this.processInstruction(this._instruction)
    }
  }

  private processInstruction(instruction: Instruction.Instruction) {
    try {
      this[instruction._tag](instruction as any)
    } catch (e) {
      this.uncaughtException(e)
    }
  }

  private Succeed(instruction: Instruction.Succeed<any>) {
    this.continueWith(instruction.i0)
  }

  private Map(instruction: Instruction.Map<any, any, any>) {
    this._instruction = instruction.i0
    this.pushFrame(new ControlFlowFrame((value) => new Instruction.Succeed(instruction.i1(value))))
  }

  private FlatMap(instruction: Instruction.FlatMap<any, any, any, any>) {
    this._instruction = instruction.i0
    this.pushFrame(new ControlFlowFrame((value) => instruction.i1(value)))
  }

  private RunOp(instruction: Instruction.RunOp<any, any>) {
    const handler = this.handlers.find(instruction.i0)

    if (!handler) {
      throw new Error(`No handler could be found for ${instruction.i0.id}`)
    }

    const resume = this.reifyStack(handler)

    if (handler._tag === 'EffectReturnHandler') {
      const values: any[] = []

      this._instruction = Instruction.Map.make(
        handler.handle(
          instruction.i1,
          (a) =>
            Instruction.Map.make(resume(a), (b) => {
              values.push(handler.onReturn(b))
            }) as Effect<never, void>,
        ),
        () => {
          const [first, ...rest] = values

          return handler.semigroup.combineMany(first, rest)
        },
      ) as Instruction.Instruction
    } else {
      this._instruction = handler.handle(instruction.i1, resume) as Instruction.Instruction
    }
  }

  private ProvideHandler<E extends Effect.Any, H extends Handler.Any>(
    instruction: Instruction.ProvideHandler<E, H>,
  ) {
    this._instruction = instruction.i0
    this.handlers.push(instruction.i1)
    this.pushFrame(new EffectHandlerFrame(instruction.i1))
  }

  private continueWith(value: any) {
    const frame = this.popFrame()

    if (!frame) {
      return this.completeWith(value)
    }

    this[frame._tag](frame as any, value)
  }

  private ControlFlowFrame(frame: ControlFlowFrame, value: any) {
    this._instruction = frame.f(value)
  }

  private EffectHandlerFrame(frame: EffectHandlerFrame, value: any) {
    this.handlers.pop(frame.handler)
    this._instruction = new Instruction.Succeed(value)
  }

  private pushFrame(frame: HandlerFrame) {
    this._frames = new Stack(frame, this._frames)
  }

  private popFrame(): HandlerFrame | null {
    if (this._frames === null) {
      return null
    }

    const frame = this._frames.value

    this._frames = this._frames.previous

    return frame
  }

  private completeWith(value: any) {
    this._instruction = null
    this._observers.notify(Exit.succeed(value))

    // TODO: Maybe run finalizers
  }

  private uncaughtException(error: unknown) {
    this._instruction = null
    this._observers.notify(Exit.die(error))

    // TODO: Maybe run finalizers
  }

  private reifyStack(handler: Handler.Any): <A>(value: A) => Instruction.Instruction {
    const frames = this._frames

    // If the stack is at its end we can just return the value
    if (!frames) return (value) => new Instruction.Succeed(value)

    // Capture the stack up until the provision of the current handler
    let stack: StackFrames = frames
    const clone: Array<HandlerFrame> = []

    while (stack !== null) {
      const frame = stack.value

      if (frame._tag === 'ControlFlowFrame') {
        clone.push(frame)
      } else {
        // Reify up until the point that we find the handler
        if (frame.handler === handler) {
          break
        }

        clone.push(frame)
      }

      stack = stack.previous
    }

    const continuation = (value: any) => {
      let effect: Instruction.Instruction = new Instruction.Succeed(value)

      for (let i = 0; i < clone.length; i++) {
        const frame = clone[i]

        if (frame._tag === 'ControlFlowFrame') {
          effect = new Instruction.FlatMap(effect, frame.f)
        } else {
          effect = new Instruction.ProvideHandler(effect, frame.handler)
        }
      }

      return effect
    }

    // Set the stack to what is left over
    this._frames = stack

    return continuation
  }
}
