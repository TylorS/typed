/* eslint-disable @typescript-eslint/no-non-null-assertion */

import * as Cause from './Cause.js'
import { Continuation } from './Continuation.js'
import { Effect } from './Effect.js'
import * as Exit from './Exit.js'
import { Handler } from './Handler.js'
import { Handlers } from './Handlers.js'
import * as Instruction from './Instruction.js'
import { Observers } from './Observers.js'
import { Stack, takeUntil } from './Stack.js'
import {
  EffectHandlerFrame,
  FlatMapCauseFrame,
  FlatMapFrame,
  HandlerFrame,
  MapFrame,
  StackFrames,
} from './StackFrames.js'
import { fromExit } from './core.js'

export class Executor<R, E, A> {
  private _started = false
  private _instruction: Instruction.Instruction | null
  private _observers = new Observers<E, A>()

  constructor(
    readonly effect: Effect<R, E, A>,
    private _frames: StackFrames = null,
    private _handlers: Handlers = new Handlers(),
  ) {
    this._instruction = effect as Instruction.Instruction
  }

  start() {
    if (this._started) return false

    this.process()

    return true
  }

  addObserver(observer: (exit: Exit.Exit<E, A>) => void) {
    return this._observers.add(observer)
  }

  private process() {
    while (this._instruction) {
      this.processInstruction(this._instruction)
    }
  }

  private processInstruction(instruction: Instruction.Instruction) {
    try {
      ;(this[instruction._tag] as (i: Instruction.Instruction) => void)(instruction)
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

    instruction.i0((instr: Instruction.Instruction) => {
      this._instruction = instr
      this.process()
    })
  }

  private YieldNow() {
    this._instruction = null

    Promise.resolve().then(() => {
      this._instruction = new Instruction.Succeed(undefined)
      this.process()
    })
  }

  private Map(instruction: Instruction.Map<any, any, any, any>) {
    this._instruction = instruction.i0
    this.pushFrame(new MapFrame(instruction.i1))
  }

  private FlatMap(instruction: Instruction.FlatMap<any, any, any, any, any, any>) {
    this._instruction = instruction.i0
    this.pushFrame(new FlatMapFrame(instruction.i1))
  }

  private FlatMapCause(instruction: Instruction.FlatMapCause<any, any, any, any, any, any>) {
    this._instruction = instruction.i0
    this.pushFrame(new FlatMapCauseFrame(instruction.i1))
  }

  private RunOp(instruction: Instruction.RunOp<any, any>) {
    const handler = this._handlers.find(instruction.i0)

    if (!handler) {
      throw new Error(`No handler could be found for ${instruction.i0.id}`)
    }

    this._instruction = (handler as any).handle(instruction.i1, this.resume(handler))
  }

  private ProvideHandler<E extends Effect.Any, H extends Handler.Any>(
    instruction: Instruction.ProvideHandler<E, H>,
  ) {
    const handler = instruction.i1 as Handler.Any

    if (handler._tag === 'EffectReturnHandler') {
      this._instruction = Instruction.Map.make(
        instruction.i0,
        instruction.i1.onReturn,
      ) as Instruction.Instruction
    } else {
      this._instruction = instruction.i0
    }

    this._handlers.push(handler)
    this.pushFrame(new EffectHandlerFrame(handler))
  }

  private Resume<A>(instruction: Instruction.Resume<A>) {
    const { i0, i1 } = instruction

    const executor = new Executor(Instruction.Succeed.make(i0), i1.frames, i1.handlers.clone())

    // Suspend this executor until the new one is done
    this._instruction = null

    executor.addObserver((exit) => {
      this._instruction = fromExit(exit) as any
      this.process()
    })

    executor.start()
  }

  private Suspend<R, E, A>(instruction: Instruction.Suspend<R, E, A>) {
    this._instruction = instruction.i0()
  }

  private continueWith(value: any) {
    const frame = this.popFrame()

    if (!frame) {
      return this.exitWith(Exit.succeed(value))
    } else if (frame._tag === 'FlatMapCauseFrame') {
      this.continueWith(value)
    } else {
      this[frame._tag](frame as any, value)
    }
  }

  private failWith(cause: Cause.Cause<any>) {
    const frame = this.popFrame()

    if (!frame) {
      return this.exitWith(Exit.failCause(cause))
    } else if (frame._tag !== 'FlatMapCauseFrame') {
      this.failWith(cause)
    } else {
      this[frame._tag](frame as any, cause)
    }
  }

  private MapFrame(frame: MapFrame, value: any) {
    this.continueWith(frame.f(value))
  }

  private FlatMapFrame(frame: FlatMapFrame, value: any) {
    this._instruction = frame.f(value)
  }

  private FlatMapCauseFrame(frame: FlatMapFrame, value: Cause.Cause<any>) {
    this._instruction = frame.f(value)
  }

  private EffectHandlerFrame(frame: EffectHandlerFrame, value: any) {
    const handler = this._handlers.pop(frame.handler)

    if (!handler) {
      throw new Error('Bug: No handler found when there absolutely should be.')
    }

    this.continueWith(value)
  }

  private pushFrame(frame: HandlerFrame) {
    this._frames = new Stack(frame, this._frames)
  }

  private popFrame(): HandlerFrame | null {
    const frames = this._frames

    if (frames === null) return null

    const frame = frames.value
    this._frames = frames.previous

    return frame
  }

  private exitWith(exit: Exit.Exit<any, any>) {
    this._instruction = null
    this._observers.notify(exit)

    // TODO: Maybe run finalizers
  }

  private uncaughtException(error: unknown) {
    this._instruction = new Instruction.Failure(Cause.die(error))
  }

  // Construct a delimited continuation from the current stack until
  // the specified handler is found.
  private cloneStackUntilHandler(handler: Handler.Any) {
    const frames = this._frames

    // If the stack is at its end we can just return the value
    if (!frames) return null

    // Collect the stack up until the last handler is found
    const [clone, remaining] = takeUntil(
      frames,
      (frame) => frame._tag === 'EffectHandlerFrame' && frame.handler === handler,
    )

    // Remove the delimited continuation from this Executor
    this._frames = remaining

    return clone
  }

  // Create a continuation which can be continued later
  private resume(handler: Handler.Any) {
    const cont: Continuation = {
      frames: this.cloneStackUntilHandler(handler),
      handlers: this._handlers.clone(),
    }

    return (input: any) => Instruction.Resume.make(input, cont)
  }
}
