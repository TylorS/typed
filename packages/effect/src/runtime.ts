import { Cause } from './Cause.js'
import { Effect } from './Effect.js'
import * as Exit from './Exit.js'
import { Handler } from './Handler.js'
import * as Instruction from './Instruction.js'
import { Op } from './Op.js'
import { Stack } from './Stack.js'
import { fromExit } from './core.js'

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
    const previous = this.map.get(handler.op) || null

    this.map.set(handler.op, new Stack(handler, previous))
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

export class Executor<R, E, A> {
  private _started = false
  private _instruction: Instruction.Instruction | null = null
  private _observers = new Observers<A>()

  constructor(
    readonly effect: Effect<R, E, A>,
    readonly handlers: Handlers = new Handlers(),
    protected _frames: StackFrames = null,
  ) {
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
      console.log('Processing instruction', this._instruction._tag)

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

  private Failure(instruction: Instruction.Failure<any>) {
    this.failWith(instruction.i0)
  }

  private Sync(instruction: Instruction.Sync<any>) {
    this.continueWith(instruction.i0())
  }

  private Async(instruction: Instruction.Async<any, any, any>) {
    this._instruction = null

    instruction.register((effect) => {
      this._instruction = effect as Instruction.Instruction

      this.process()
    })
  }

  private Map(instruction: Instruction.Map<any, any, any, any>) {
    this._instruction = instruction.i0
    this.pushFrame(new ControlFlowFrame((value) => new Instruction.Succeed(instruction.i1(value))))
  }

  private FlatMap(instruction: Instruction.FlatMap<any, any, any, any, any, any>) {
    this._instruction = instruction.i0
    this.pushFrame(new ControlFlowFrame((value) => instruction.i1(value)))
  }

  private RunOp(instruction: Instruction.RunOp<any, any>) {
    const handler = this.handlers.find(instruction.i0)

    if (!handler) {
      throw new Error(`No handler could be found for ${instruction.i0.id}`)
    }

    const resume = this.resume(this.cloneStackUntilHandler(handler))

    if (handler._tag === 'EffectHandler') {
      this._instruction = handler.handle(instruction.i1, resume) as Instruction.Instruction
    } else {
      const values: any[] = []

      this._instruction = Instruction.Map.make(
        handler.handle(instruction.i1, (a) =>
          Instruction.Map.make(resume(a), (b) => {
            values.push(handler.onReturn(b))
          }),
        ),
        () => {
          const [first, ...rest] = values
          const result = handler.semigroup.combineMany(first, rest)

          console.log('Result', result)

          return result
        },
      ) as Instruction.Instruction
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

  private failWith(cause: Cause<never>) {
    this._instruction = null
    this._observers.notify(Exit.failCause(cause))
  }

  private uncaughtException(error: unknown) {
    this._instruction = null
    this._observers.notify(Exit.die(error))

    // TODO: Maybe run finalizers
  }

  private cloneStackUntilHandler(handler: Handler.Any) {
    const frames = this._frames

    // If the stack is at its end we can just return the value
    if (!frames) return null

    const [clone, remaining] = frames.takeUntil(
      (frame) => frame._tag === 'EffectHandlerFrame' && frame.handler === handler,
    )

    this._frames = remaining

    return clone
  }

  private resume(frames: StackFrames) {
    const handlers = this.handlers.clone()

    return (value: any) =>
      Instruction.Async.make<never, never, any>((k) => {
        const executor = new Executor(new Instruction.Succeed(value), handlers.clone(), frames)

        executor.addObserver((exit) => k(fromExit(exit)))
        executor.start()
      })
  }
}
