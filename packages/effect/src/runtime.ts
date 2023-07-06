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
  // State to check if Executor.start() has been called
  private _started = false

  // The current instruction to process, if any
  private _instruction: Instruction.Instruction | null

  // The observers of the output of this executor
  private _observers = new Observers<E, A>()

  constructor(
    // The initial Effect to execute
    readonly effect: Effect<R, E, A>,
    // The initial set of stack frames
    private _frames: StackFrames = null,
    // The initial set of effect handlers
    private _handlers: Handlers = new Handlers(),
  ) {
    this._instruction = effect as Instruction.Instruction
  }

  start() {
    // Can only be started once
    if (this._started) return false

    this.process()

    return true
  }

  addObserver(observer: (exit: Exit.Exit<E, A>) => void) {
    return this._observers.add(observer)
  }

  private process() {
    // For as long as there is an instruction to process, process it
    while (this._instruction) {
      this.processInstruction(this._instruction)
    }
  }

  private processInstruction(instruction: Instruction.Instruction) {
    try {
      // Each instruction tag is a method on this class
      ;(this[instruction._tag] as (i: Instruction.Instruction) => void)(instruction)
    } catch (e) {
      // Catch any errors and unwind the executor to any error handlers
      this.uncaughtException(e)
    }
  }

  // Succeed instructions are synchronous and passed along to the next success continuation
  private Succeed(instruction: Instruction.Succeed<any>) {
    this.continueWith(instruction.i0)
  }

  // Fail instructions are synchronous and passed along to the next failure continuation
  private Failure(instruction: Instruction.Failure<any>) {
    this.failWith(instruction.i0)
  }

  // FlatMap instructions are synchronous and passed along to the next continuation
  private Sync(instruction: Instruction.Sync<any>) {
    this.continueWith(instruction.i0())
  }

  // Break insruction halts the executor
  private Break() {
    this._instruction = null
  }

  private Async(instruction: Instruction.Async<any, any, any, any, any>) {
    // State to keep track of whether or not the Async effect was actually synchronous
    let nextInstruction: Instruction.Instruction | null = null
    let finishedSetup = false

    this._instruction = new Instruction.FlatMap(
      instruction.i0((instr: Instruction.Instruction) => {
        // Can only be called once
        if (nextInstruction) return

        // The setup Effect has finished running, so we can now run the actual effect immediately
        if (finishedSetup) {
          this._instruction = nextInstruction = instr
          this.process()
        } else {
          // Store the instruction to run once the setup effect has finished
          nextInstruction = instr
        }
      }),
      () => {
        finishedSetup = true

        // If the async callback has already been called, then we can run the actual effect immediately
        if (nextInstruction) return nextInstruction

        // Otherwise, we need to suspend the executor until the callback is called
        return new Instruction.Break()
      },
    )

    // If the callback ran synchronously, we can just let the executor continue
    if (nextInstruction) {
      this._instruction = nextInstruction
    }
  }

  private YieldNow() {
    // Halt current exection
    this._instruction = null

    // Schedule a microtask to resume execution
    Promise.resolve().then(() => {
      this._instruction = new Instruction.Succeed(undefined)
      this.process()
    })
  }

  // Add a new MapFrame to the stack
  private Map(instruction: Instruction.Map<any, any, any, any>) {
    this._instruction = instruction.i0
    this.pushFrame(new MapFrame(instruction.i1))
  }

  // Add a new FlatMapFrame to the stack
  private FlatMap(instruction: Instruction.FlatMap<any, any, any, any, any, any>) {
    this._instruction = instruction.i0
    this.pushFrame(new FlatMapFrame(instruction.i1))
  }

  // Add a new FlatMapCauseFrame to the stack
  private FlatMapCause(instruction: Instruction.FlatMapCause<any, any, any, any, any, any>) {
    this._instruction = instruction.i0
    this.pushFrame(new FlatMapCauseFrame(instruction.i1))
  }

  // Run an operation
  private RunOp(instruction: Instruction.RunOp<any, any>) {
    // Find the latest version of the handler in the stack
    const handler = this._handlers.find(instruction.i0)

    if (!handler) {
      throw new Error(`No handler could be found for ${instruction.i0.id}`)
    }

    // Replace the instruction with the result of running the operation
    this._instruction = (handler as any).handle(instruction.i1, this.resume(handler))
  }

  // Provide a handler for the current effect
  private ProvideHandler<E extends Effect.Any, H extends Handler.Any>(
    instruction: Instruction.ProvideHandler<E, H>,
  ) {
    const handler = instruction.i1 as Handler.Any

    if (handler._tag === 'EffectReturnHandler') {
      // Return handlers have a transformation of the result
      this._instruction = Instruction.Map.make(
        instruction.i0,
        instruction.i1.onReturn,
      ) as Instruction.Instruction
    } else {
      this._instruction = instruction.i0
    }

    // Add the handler to the stack
    this._handlers.push(handler)

    // Add this Frame to the stack to remove the handler when the effect is done
    this.pushFrame(new EffectHandlerFrame(handler))
  }

  // Resume another Continuation
  private Resume<A>(instruction: Instruction.Resume<A>) {
    const { i0, i1 } = instruction

    // Create a new executor to run the continuation with the provided frrames and handlers
    const executor = new Executor(Instruction.Succeed.make(i0), i1.frames, i1.handlers)

    // Suspend this executor until the new one is done
    this._instruction = null

    // When the new executor is done, resume this one with the result
    executor.addObserver((exit) => {
      this._instruction = fromExit(exit) as any
      this.process()
    })

    // Start the new executor
    executor.start()
  }

  // Lazily construct the next instruction
  private Suspend<R, E, A>(instruction: Instruction.Suspend<R, E, A>) {
    this._instruction = instruction.i0()
  }

  // Unwind the stack with a successful value
  private continueWith(value: any) {
    const frame = this.popFrame()

    // If the is no frame, then we can exit
    if (!frame) {
      return this.exitWith(Exit.succeed(value))
      // Success values don't deal with causes, so we need to keep unwinding
    } else if (frame._tag === 'FlatMapCauseFrame') {
      this.continueWith(value)
    } else {
      // Apply the frame to the value and continue
      this[frame._tag](frame as any, value)
    }
  }

  // Unwind the stack with a failure/cause
  private failWith(cause: Cause.Cause<any>) {
    const frame = this.popFrame()

    // If there is no frame, then we can exit
    if (!frame) {
      return this.exitWith(Exit.failCause(cause))

      // We only handle FlatMapCauseFrames here, so if its not
      // we need to keep unwinding
    } else if (frame._tag !== 'FlatMapCauseFrame') {
      this.failWith(cause)
    } else {
      // Handle the failure with the frame and continue
      this[frame._tag](frame as any, cause)
    }
  }

  // Apply a map frame to the current value and continue unwinding the stack
  private MapFrame(frame: MapFrame, value: any) {
    this.continueWith(frame.f(value))
  }

  // Compute the next instruction
  private FlatMapFrame(frame: FlatMapFrame, value: any) {
    this._instruction = frame.f(value)
  }

  // Compute the next instruction from a failure
  private FlatMapCauseFrame(frame: FlatMapFrame, value: Cause.Cause<any>) {
    this._instruction = frame.f(value)
  }

  // Pop the handler from the stack and continue unwinding the stack
  private EffectHandlerFrame(frame: EffectHandlerFrame, value: any) {
    const handler = this._handlers.pop(frame.handler)

    if (!handler) {
      throw new Error('Bug: No handler found when there absolutely should be.')
    }

    this.continueWith(value)
  }

  // Push a new frame onto the stack
  private pushFrame(frame: HandlerFrame) {
    this._frames = new Stack(frame, this._frames)
  }

  // Pop a frame from the stack
  private popFrame(): HandlerFrame | null {
    const frames = this._frames

    if (frames === null) return null

    const frame = frames.value
    this._frames = frames.previous

    return frame
  }

  // Exit the executor with the specified exit
  private exitWith(exit: Exit.Exit<any, any>) {
    this._instruction = null
    this._observers.notify(exit)

    // TODO: Maybe run finalizers
  }

  // Handle uncaught exceptions
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
      handlers: this._handlers,
    }

    return (input: any) => Instruction.Resume.make(input, cont)
  }
}

export function runPromiseExit<E, A>(effect: Effect<never, E, A>): Promise<Exit.Exit<E, A>> {
  return new Promise((resolve) => {
    const executor = new Executor(effect)

    executor.addObserver(resolve)
    executor.start()
  })
}

export function runPromise<E, A>(effect: Effect<never, E, A>): Promise<A> {
  return new Promise((resolve, reject) => {
    const executor = new Executor(effect)

    executor.addObserver(
      Exit.match(
        (cause) => reject(new CauseError(cause)),
        (value) => resolve(value),
      ),
    )
    executor.start()
  })
}

export class CauseError<E> extends Error {
  constructor(readonly cause: Cause.Cause<E>) {
    super(Cause.pretty(cause))
  }
}
