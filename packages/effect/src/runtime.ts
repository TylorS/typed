/* eslint-disable @typescript-eslint/no-non-null-assertion */

import * as Cause from './Cause.js'
import { Continuation } from './Continuation.js'
import { Effect } from './Effect.js'
import * as Exit from './Exit.js'
import * as Fiber from './Fiber.js'
import { Handler } from './Handler.js'
import { Handlers } from './Handlers.js'
import * as Instruction from './Instruction.js'
import { Observers } from './Observers.js'
import { Stack, takeUntil } from './Stack.js'
import {
  EffectHandlerFrame,
  FinalizerFrame,
  FlatMapCauseFrame,
  FlatMapFrame,
  HandlerFrame,
  MapFrame,
  StackFrames,
} from './StackFrames.js'
import { asyncInterrupt, fromExit } from './core.js'

export class Executor<R, E, A> implements Fiber.Fiber<E, A> {
  // State to check if Executor.start() has been called
  private _started = false
  // The current instruction to process, if any
  private _instruction: Instruction.Instruction | null
  // The observers of the output of this executor
  private _observers = new Observers<E, A>()
  // The exit value of this executor
  private _exit: Exit.Exit<E, A> | null = null
  // The cause of this executor
  private _cause: Cause.Cause<E> = Cause.empty
  // The child fibers of this executor
  private _children: Set<Fiber.Fiber<any, any>> = new Set()

  // The ID of this fiber
  readonly id: Fiber.Id.FiberId = Fiber.Id.unsafeMake()

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

  readonly wait = Instruction.Suspend.make<never, never, Exit.Exit<E, A>>(() => {
    if (this._exit) {
      return Instruction.Succeed.make(this._exit)
    }

    return new Instruction.Async((k) => ({
      dispose: this.addObserver((exit) => k(new Instruction.Succeed(exit))),
    }))
  })

  interrupt(id: Fiber.Id.FiberId) {
    return Instruction.Suspend.make(() => {
      if (this._exit) return Instruction.Succeed.make(this._exit)

      this.failWith((this._cause = Cause.sequential(this._cause, Cause.interrupt(id))))
      this.process()

      return new Instruction.Async((k) => ({
        dispose: this.addObserver((exit) => k(new Instruction.Succeed(exit))),
      }))
    })
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
    this.failWith(Cause.sequential(this._cause, instruction.i0))
  }

  // FlatMap instructions are synchronous and passed along to the next continuation
  private Sync(instruction: Instruction.Sync<any>) {
    this.continueWith(instruction.i0())
  }

  // Break insruction halts the executor
  private Break() {
    this._instruction = null
  }

  private Async(instruction: Instruction.Async<any, any, any>) {
    // State to keep track of whether or not the Async effect was actually synchronous
    let nextInstruction: Instruction.Instruction | null = null
    let finishedSetup = false

    this._instruction = null

    const disposable = instruction.i0((instr: Instruction.Instruction) => {
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
    })

    this.pushFrame(new FinalizerFrame(() => Instruction.Sync.make(() => disposable.dispose())))

    finishedSetup = true

    if (nextInstruction) {
      this._instruction = nextInstruction
    }
  }

  private Zip(instruction: Instruction.Zip<any>) {
    const { i0 } = instruction

    this._instruction = asyncInterrupt<any, any, any, any, any>((cb) => {
      const executors: Executor<any, any, any>[] = i0.map(
        (effect: Effect.Any) => new Executor(effect, null, this._handlers.clone()),
      )

      const values: any[] = []

      function onExit(exit: Exit.Exit<any, any>, index: number) {
        if (Exit.isSuccess(exit)) {
          values[index] = exit.value

          if (executors.length === values.length) {
            cb(new Instruction.Succeed(values))
          }
        } else {
          cb(
            new Instruction.FlatMap(
              new Instruction.Zip(executors.map((e) => e.interrupt(executors[index].id))),
              () => new Instruction.Failure(exit.cause),
            ),
          )
        }
      }

      executors.forEach((executor, i) => {
        executor.addObserver((exit) => onExit(exit, i))
        executor.start()
      })

      return new Instruction.Zip(executors.map((e) => e.interrupt(this.id)))
    }) as Instruction.Instruction
  }

  private Fork(instruction: Instruction.Fork<any, any, any>) {
    const executor = new Executor(
      new Instruction.FlatMap(
        new Instruction.YieldNow(),
        () =>
          new Instruction.Map(instruction.i0, (x) => {
            this._children.delete(executor)

            return x
          }),
      ),
      null,
      this._handlers.clone(),
    )

    this._children.add(executor)

    this._instruction = new Instruction.Succeed(executor)

    executor.start()
  }

  private YieldNow() {
    // Halt current exection
    this._instruction = null

    // Schedule a microtask to resume execution
    Promise.resolve().then(() => {
      this.continueWith(undefined)
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

  private AddFinalizer(instruction: Instruction.AddFinalizer<any>) {
    this.continueWith(undefined)
    this.pushFrame(new FinalizerFrame(instruction.i0))
  }

  // Unwind the stack with a successful value
  private continueWith(value: any) {
    const frame = this.popFrame()

    // If the is no frame, then we can exit
    if (frame === null) {
      return this.exitWith(Exit.succeed(value))
      // Success values don't deal with causes, so we need to keep unwinding
    } else if (frame._tag === 'FlatMapCauseFrame') {
      this.continueWith(value)
    } else if (frame._tag === 'FinalizerFrame') {
      this.FinalizerFrame(frame, Exit.succeed(value))
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
    } else if (frame._tag === 'FinalizerFrame') {
      this.FinalizerFrame(frame, Exit.failCause(cause))
    } else if (frame._tag === 'FlatMapCauseFrame') {
      this.FlatMapCauseFrame(frame, cause)
    } else {
      this.failWith(cause)
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
  private FlatMapCauseFrame(frame: FlatMapCauseFrame, value: Cause.Cause<any>) {
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

  private FinalizerFrame(frame: FinalizerFrame, value: Exit.Exit<any, any>) {
    if (Exit.isSuccess(value)) {
      this._instruction = new Instruction.Map(frame.finalizer(value), () => value.value)
    } else {
      this._instruction = new Instruction.FlatMap(
        new Instruction.FlatMapCause(
          frame.finalizer(value),
          (cause) => new Instruction.Failure(Cause.sequential(value.cause, cause)),
        ),
        () => new Instruction.Failure(value.cause),
      )
    }
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
    if (this._children.size === 0) {
      this.onDone(exit)
    } else {
      this._instruction = new Instruction.Map(
        new Instruction.Zip(Array.from(this._children).map((c) => c.interrupt(this.id))),
        () => this.onDone(exit),
      )
    }
  }

  private onDone(exit: Exit.Exit<any, any>) {
    this._instruction = null
    this._observers.notify(exit)
    this._exit = exit
  }

  // Handle uncaught exceptions
  private uncaughtException(error: unknown) {
    this._instruction = new Instruction.Failure(Cause.sequential(this._cause, Cause.die(error)))
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

    executor.addObserver(Exit.match((cause) => reject(new CauseError(cause)), resolve))
    executor.start()
  })
}

export class CauseError<E> extends Error {
  constructor(readonly cause: Cause.Cause<E>) {
    super(Cause.pretty(cause))
  }
}
