import * as Context from '@fp-ts/data/Context'
import * as Either from '@fp-ts/data/Either'
import { pipe } from '@fp-ts/data/Function'
import * as Cause from '@typed/cause'
import * as C from '@typed/clock'
import * as Disposable from '@typed/disposable'
import { Exit } from '@typed/exit'
import { RingBuffer, NonEmptyStack } from '@typed/internal'

import { getDefaultService } from '../DefaultServices/DefaultServices.js'
import { Effect } from '../Effect/Effect.js'
import * as I from '../Effect/Instruction.js'
import type { RuntimeFiber } from '../Fiber/Fiber.js'
import { FiberId, Live } from '../FiberId/FiberId.js'
import type { FiberRefs } from '../FiberRefs/FiberRefs.js'
import { FiberScope } from '../FiberScope/FiberScope.js'
import * as FiberStatus from '../FiberStatus/FiberStatus.js'
import { pending } from '../Future/Future.js'
import { IdGenerator } from '../IdGenerator/IdGenerator.js'
import type { RuntimeFlags } from '../RuntimeFlags/RuntimeFlags.js'
import { Scheduler } from '../Scheduler/Scheduler.js'

import {
  FlatMapCauseFrame,
  FlatMapFrame,
  Frame,
  InterruptFrame,
  MapCauseFrame,
  MapFrame,
  PopFrame,
  TraceFrame,
} from './Frame.js'

export interface RuntimeOptions<R> {
  readonly id: FiberId
  readonly context: Context.Context<R>
  readonly scope: FiberScope
  readonly fiberRefs: FiberRefs
  readonly flags: RuntimeFlags
}

const combineSeq = Cause.getSequentialMonoid<any>().combine

export class FiberRuntime<Services, Errors, Output> implements RuntimeFiber<Errors, Output> {
  protected disposable: Disposable.Disposable.Queue = Disposable.Queue()
  protected currentContext: NonEmptyStack<Context.Context<any>> = new NonEmptyStack(
    this.options.context,
  )
  protected currentFiberRefs: NonEmptyStack<FiberRefs> = new NonEmptyStack(this.options.fiberRefs)
  protected currentRuntimeFlags: NonEmptyStack<RuntimeFlags> = new NonEmptyStack(this.options.flags)
  protected fiberStatus: FiberStatus.FiberStatus<Errors, Output> = FiberStatus.Pending
  protected frames: Frame[] = []
  // TODO: Allow resizig RingBuffer as runtime flags are updated
  protected executionTrace = new RingBuffer<string>(this.options.flags.maxExecutionTraceCount)
  protected instr!: I.Instruction<any, any, any> | null
  protected interruptCause: Cause.Cause<Errors> = Cause.Empty
  protected interrupting = false
  protected observers: ((exit: Exit<Errors, Output>) => void)[] = []
  protected started = false

  constructor(
    readonly effect: Effect<Services, Errors, Output>,
    readonly options: RuntimeOptions<Services>,
  ) {
    this.setInstr(effect)
  }

  readonly tag: RuntimeFiber<Errors, Output>['tag'] = 'Runtime'

  readonly id: RuntimeFiber<Errors, Output>['id'] = this.options.id

  readonly exit: RuntimeFiber<Errors, Output>['exit'] = new I.Lazy(() => {
    if (this.fiberStatus.tag === 'Done') {
      return new I.Of(this.fiberStatus.exit)
    }

    const future = pending<never, never, Exit<Errors, Output>>()

    this.addObserver((exit) => future.complete(new I.Of(exit)))

    return new I.Async(future)
  })

  get inheritRefs(): RuntimeFiber<Errors, Output>['inheritRefs'] {
    return this.currentFiberRefs.current.inherit
  }

  readonly addObserver: RuntimeFiber<Errors, Output>['addObserver'] = (observer) => {
    if (this.fiberStatus.tag === 'Done') {
      observer(this.fiberStatus.exit)

      return Disposable.Disposable.unit
    }

    this.observers.push(observer)

    return Disposable.Disposable(() => {
      const i = this.observers.indexOf(observer)

      if (i > -1) {
        this.observers.splice(i, 1)
      }
    })
  }

  readonly interruptAs: RuntimeFiber<Errors, Output>['interruptAs'] = (id: FiberId) =>
    new I.Lazy(() => {
      this.interruptCause = pipe(
        this.interruptCause,
        // TODO: pretty print id
        combineSeq(Cause.Interrupted(`${JSON.stringify(id)}`)),
      )

      // Interrupt immediately if interruptable
      if (this.currentRuntimeFlags.current.interruptStatus) {
        this.continueWithCause(this.interruptCause)
      }

      // Always wait for the exit value for synchronization
      return this.exit
    })

  // Only public to users of FiberRuntime directly
  public start(): boolean {
    if (this.started) {
      return false
    }

    this.loop()

    return (this.started = true)
  }

  // Internals

  /**
   * The main loop, processes the current instruction for as long as it can
   * yielding whenever any async operation is encountered.
   */
  protected loop() {
    this.running()

    while (this.instr) {
      try {
        this.step(this.instr)
      } catch (e) {
        // TODO: capture stack trace info
        this.continueWithCause(Cause.Unexpected(e))
      }
    }

    this.pending()
  }

  protected step(instr: I.Instruction<any, any, any>) {
    ;(this[instr.tag] as (i: typeof instr) => void)(instr)
  }

  // Constructors

  protected Of(instr: I.Of<any>) {
    this.addExecution(instr.__trace)
    this.continueWith(instr.input)
  }

  protected FromCause(instr: I.FromCause<any>) {
    this.addExecution(instr.__trace)
    this.continueWithCause(instr.input)
  }

  protected Sync(instr: I.Sync<any>) {
    this.addExecution(instr.__trace)
    this.continueWith(instr.input())
  }

  protected Async(instr: I.Async<any, any, any>) {
    this.addTrace(instr.__trace)

    const { state, addObserver } = instr.input

    // If the future is resolved, just use it's value now
    if (state.tag === 'Resolved') {
      return this.setInstr(state.effect)
    }

    // Otherwise wait for the future to resolve
    const inner = Disposable.Queue()

    inner.offer(
      addObserver((effect) => {
        inner.dispose()
        this.setInstr(effect)
        this.loop()
      }),
    )

    inner.offer(this.disposable.offer(inner))

    // If we didn't resume synchronously, ensure we yield to other fibers
    if (!inner.isDisposed()) {
      this.instr = null
    }
  }

  protected Lazy(instr: I.Lazy<any, any, any>) {
    this.addTrace(instr.__trace)
    this.setInstr(instr.input())
  }

  // Functionality

  protected AccessContext(instr: I.AccessContext<any, any, any, any>) {
    this.addTrace(instr.__trace)
    this.setInstr(instr.input(this.currentContext.current))
  }

  protected ProvideContext(instr: I.ProvideContext<any, any, any>) {
    const [effect, ctx] = instr.input
    this.currentContext.push(ctx)
    this.frames.push(new PopFrame(() => this.currentContext.pop(), instr.__trace))
    this.setInstr(effect)
  }

  protected GetFiberScope(instr: I.GetFiberScope) {
    this.addExecution(instr.__trace)
    this.continueWith(this.options.scope)
  }

  protected GetRuntimeFlags(instr: I.GetRuntimeFlags) {
    this.addExecution(instr.__trace)
    this.continueWith(this.currentRuntimeFlags.current)
  }

  protected UpdateRuntimeFlags(instr: I.UpdateRuntimeFlags<any, any, any>) {
    const [effect, f] = instr.input
    const current = this.currentRuntimeFlags.current
    const updated = f(current)

    // If currently interruptable, mark this spot in the stack to check for
    // interrupters of this fiber
    if (current.interruptStatus && !updated.interruptStatus) {
      this.frames.push(new InterruptFrame())
    }

    this.currentRuntimeFlags.push(updated)
    this.frames.push(new PopFrame(() => this.currentRuntimeFlags.pop(), instr.__trace))
    this.setInstr(effect)
  }

  protected GetFiberRefs(instr: I.GetFiberRefs) {
    this.addExecution(instr.__trace)
    this.continueWith(this.currentFiberRefs.current)
  }

  protected WithFiberRefs(instr: I.WithFiberRefs<any, any, any>) {
    const [effect, refs] = instr.input
    this.currentFiberRefs.push(refs)
    this.frames.push(new PopFrame(() => this.currentFiberRefs.pop(), instr.__trace))
    this.setInstr(effect)
  }

  protected GetFiberId(instr: I.GetFiberId) {
    this.addExecution(instr.__trace)
    this.continueWith(this.options.id)
  }

  protected GetRuntimeOptions(instr: I.GetRuntimeOptions<any>) {
    this.addExecution(instr.__trace)
    this.continueWith(this.getCurrentRuntimeOptions())
  }

  protected Fork(instr: I.Fork<any, any, any>) {
    this.addExecution(instr.__trace)

    const [effect, overrides] = instr.input
    const id = Live(this.getNextId(), C.getTime(this.getScheduler()))
    const options = {
      ...this.getCurrentRuntimeOptions(),
      ...overrides,
    }
    const scope = FiberScope(id)
    const child = new FiberRuntime(effect, {
      ...options,
      id,
      fiberRefs: options.fiberRefs.fork(),
      context: pipe(options.context, Context.add(Scheduler)(this.getScheduler().fork())),
      scope,
    })

    options.scope.addChild(child)
    child.start()
    this.continueWith(child)
  }
  // Frames

  protected Map(instr: I.Map<any, any, any, any>) {
    const [effect, f] = instr.input
    this.frames.push(new MapFrame(f, instr.__trace))
    this.setInstr(effect)
  }

  protected FlatMap(instr: I.FlatMap<any, any, any, any, any, any>) {
    const [effect, f] = instr.input
    this.frames.push(new FlatMapFrame(f, instr.__trace))
    this.setInstr(effect)
  }

  protected Match(instr: I.Match<any, any, any, any, any, any, any, any, any>) {
    const [effect, f, g] = instr.input
    this.frames.push(new FlatMapFrame(g, instr.__trace), new FlatMapCauseFrame(f))
    this.setInstr(effect)
  }

  protected MapCause(instr: I.MapCause<any, any, any, any>) {
    const [effect, f] = instr.input
    this.frames.push(new MapCauseFrame(f, instr.__trace))
    this.setInstr(effect)
  }

  protected FlatMapCause(instr: I.FlatMapCause<any, any, any, any, any, any>) {
    const [effect, f] = instr.input
    this.frames.push(new FlatMapCauseFrame(f, instr.__trace))
    this.setInstr(effect)
  }

  // Control flow

  protected continueWith(value: any): void {
    const frame = this.frames.pop()

    if (!frame) {
      return this.done(Either.right(value))
    }

    const tag = frame.tag

    if (tag === 'FlatMap') {
      return this.setInstr(frame.f(value))
    } else if (tag === 'Map') {
      value = frame.f(value)
    } else if (tag === 'Pop') {
      frame.f()
    } else if (tag === 'Interrupt') {
      if (this.shouldInterrupt()) {
        return this.interruptNow()
      }
    }

    this.continueWith(value)
  }

  protected continueWithCause(cause: Cause.Cause<Errors>): void {
    const frame = this.frames.pop()

    if (!frame) {
      return this.done(Either.left(cause))
    }

    const tag = frame.tag

    if (tag === 'FlatMapCause') {
      return this.setInstr(frame.f(cause))
    } else if (tag === 'MapCause') {
      cause = frame.f(cause)
    } else if (tag === 'Pop') {
      frame.f()
    } else if (tag === 'Interrupt') {
      if (this.shouldInterrupt()) {
        return this.interruptNow()
      }
    }

    this.continueWithCause(cause)
  }

  // Status updates

  protected pending() {
    if (this.fiberStatus.tag === 'Running') {
      this.fiberStatus = FiberStatus.Pending
    }
  }

  protected running() {
    if (this.fiberStatus.tag === 'Pending') {
      this.fiberStatus = FiberStatus.Running
    }
  }

  protected done(exit: Exit<Errors, Output>): void {
    const { scope } = this.options

    if (scope.size > 0) {
      this.frames.push(new PopFrame(() => this.complete(exit)))

      return this.setInstr(scope.interruptChildren)
    }

    this.complete(exit)
  }

  protected complete(exit: Exit<Errors, Output>): void {
    this.instr = null
    this.disposable.dispose()
    this.observers.forEach((observer) => observer(exit))
    this.observers = []
  }

  // Helpers

  protected setInstr(effect: Effect<any, any, any> | null): void {
    this.instr = effect as I.Instruction<any, any, any> | null
  }

  protected addTrace(trace?: string) {
    if (this.options.flags.shouldTrace && trace) {
      this.frames.push(new TraceFrame(trace))
    }
  }

  protected addExecution(trace?: string) {
    if (this.options.flags.shouldTrace && trace) {
      this.executionTrace.push(trace)
    }
  }

  protected getScheduler() {
    return getDefaultService(this.currentContext.current, this.currentFiberRefs.current, Scheduler)
  }

  protected getNextId() {
    return getDefaultService(
      this.currentContext.current,
      this.currentFiberRefs.current,
      IdGenerator,
    )()
  }

  protected shouldInterrupt() {
    return !this.interrupting && this.interruptCause._tag !== 'Empty' && this.frames.length > 0
  }

  protected interruptNow() {
    this.interrupting = true
    this.continueWithCause(this.interruptCause)
  }

  protected getCurrentRuntimeOptions() {
    return {
      context: this.currentContext.current,
      scope: this.options.scope,
      fiberRefs: this.currentFiberRefs.current,
      flags: this.currentRuntimeFlags.current,
    }
  }
}
