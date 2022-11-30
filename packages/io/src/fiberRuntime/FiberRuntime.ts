import * as Context from '@fp-ts/data/Context'
import * as Duration from '@fp-ts/data/Duration'
import * as Either from '@fp-ts/data/Either'
import { pipe } from '@fp-ts/data/Function'
import { Cause } from '@typed/cause'
import * as Disposable from '@typed/disposable'
import { Exit } from '@typed/exit'
import { NonEmptyStack, RingBuffer } from '@typed/internal'
import * as Trace from '@typed/trace'

import * as Effect from '../effect/Effect.js'
import { Fiber, LiveFiber } from '../fiber/Fiber.js'
import { Done, FiberStatus, Running, Suspended } from '../fiber/FiberStatus.js'
import { FiberId } from '../fiber/index.js'
import { FiberRefs } from '../fiberRefs/fiberRefs.js'
import { FiberScope } from '../fiberScope/FiberScope.js'
import { pending } from '../future/future.js'
import { RuntimeFlags } from '../runtimeFlags/RuntimeFlags.js'
import { RuntimeOptions } from '../runtimeOptions/index.js'

import * as FiberFrame from './FiberFrame.js'

export class FiberRuntime<R, E, A> implements LiveFiber<E, A> {
  protected _started = false
  protected _instr!: Effect.Effect.Instruction | null
  protected _status: FiberStatus<E, A> = Suspended
  protected _observers: Array<Fiber.Observer<E, A>> = []
  protected _frames: Array<FiberFrame.FiberFrame> = []
  protected _context = new NonEmptyStack(this.options.context)
  protected _fiberRefs = new NonEmptyStack(this.options.fiberRefs)
  protected _flags = new NonEmptyStack(this.options.flags)
  protected _executionTrace = new RingBuffer<Trace.Trace>(this.options.flags.executionTraceLimit)
  protected _stackTrace = new NonEmptyStack<Trace.Trace>(Trace.EmptyTrace)
  protected _disposable = Disposable.Queue()

  constructor(readonly effect: Effect.Effect<R, E, A>, readonly options: RuntimeOptions<R>) {
    this.setInstr(effect)
  }

  readonly _tag = 'Live';
  readonly [Fiber.TypeId] = Fiber.Variance
  readonly id = this.options.id
  readonly fiberRefs = Effect.fromLazy(() => this.getFiberRefs())
  readonly runtimeFlags = Effect.fromLazy(() => this.getRuntimeFlags())
  readonly platform = Effect.now(this.options.platform)
  readonly addObserver: LiveFiber<E, A>['addObserver'] = (observer) => {
    if (this._status._tag === 'Done') {
      const exit = this._status.exit
      return this.options.platform.scheduler.setTimer(() => observer(exit), Duration.zero)
    }

    this._observers.push(observer)

    return Disposable.Disposable(() => {
      const index = this._observers.indexOf(observer)

      if (index > -1) {
        this._observers.splice(index, 1)
      }
    })
  }
  readonly exit: LiveFiber<E, A>['exit'] = Effect.lazy(() => {
    if (this._status._tag === 'Done') {
      return Effect.now(this._status.exit)
    }

    const future = pending<never, never, Exit<E, A>>()

    const disposable = this.addObserver((exit) => future.complete(Effect.now(exit)))

    return pipe(
      Effect.wait(future),
      Effect.onInterrupt(() => Effect.fromLazy(() => disposable.dispose())),
    )
  })
  readonly inheritFiberRefs: LiveFiber<E, A>['inheritFiberRefs'] = Effect.lazy(
    () => this.getFiberRefs().inherit,
  )
  readonly join: LiveFiber<E, A>['join'] = pipe(
    this.exit,
    Effect.tap(() => this.getFiberRefs().inherit),
    Effect.flatMap(Effect.fromExit),
  )
  readonly trace: LiveFiber<E, A>['trace'] = Effect.fromLazy(() => this.getTrace())
  readonly interruptAs: LiveFiber<E, A>['interruptAs'] = (id) =>
    Effect.lazy(() => {
      // TODO
      return {} as any
    })

  public start() {
    if (this._started) {
      return false
    }

    this._started = true

    this.loop()

    return true
  }

  protected loop() {
    this.running()

    while (this._instr) {
      try {
        this.step(this._instr)
      } catch (e) {
        this.uncaughtException(e)
      }
    }

    this.suspended()
  }

  protected step(instr: Effect.Effect.Instruction) {
    this[instr._tag](instr as any)
  }

  protected continueWith(value: any) {
    let frame = this._frames.pop()

    while (frame) {
      // TODO:
      frame = this._frames.pop()
    }

    this.done(Either.right(value))
  }

  protected continueWithCause(cause: Cause<any>) {
    let frame = this._frames.pop()

    while (frame) {
      // TODO
      frame = this._frames.pop()
    }

    this.done(Either.left(cause))
  }

  protected running() {
    if (this._status === Suspended) {
      this._status = Running
    }
  }

  protected suspended() {
    if (this._status === Running) {
      this._status = Suspended
    }
  }

  protected done(exit: Exit<E, A>) {
    this._status = Done(exit)
  }

  protected uncaughtException(e: unknown) {
    // TODO
  }

  protected Ensuring(instr: Effect.Ensuring<any, any, any, any, any, any>) {
    const [effect, f] = instr.input
    this._frames.push(FiberFrame.EnsuringFrame(f))
    this.setInstr(effect)
  }

  protected FlatMap(instr: Effect.FlatMap<any, any, any, any, any, any>) {
    const [effect, f] = instr.input
    this._frames.push(FiberFrame.FlatMapFrame(f))
    this.setInstr(effect)
  }

  protected Fork(instr: Effect.Fork<any, any, any>) {
    const [effect, overrides] = instr.input
    const options = {
      ...this.getRuntimeOptions(),
      ...overrides,
    }
    const { platform } = options
    const id = FiberId.Live(platform.nextId(), platform.scheduler.currentTime())
    const scope = FiberScope(id)
    const fiberRefs = overrides?.fiberRefs ?? options.fiberRefs.fork()
    const child = new FiberRuntime(effect, {
      ...options,
      id,
      scope,
      fiberRefs,
    })

    options.scope.addChild(child)
    child.start()

    this.continueWith(child)
  }

  protected FromCause(instr: Effect.FromCause<any>) {
    this.continueWithCause(instr.input)
  }

  protected FromLazy(instr: Effect.FromLazy<any>) {
    this.continueWith(instr.input())
  }

  protected Lazy(instr: Effect.Lazy<any, any, any>) {
    this.setInstr(instr.input())
  }

  protected Map(instr: Effect.Map<any, any, any, any>) {
    const [effect, f] = instr.input
    this._frames.push(FiberFrame.MapFrame(f))
    this.setInstr(effect)
  }

  protected MapCause(instr: Effect.MapCause<any, any, any, any>) {
    const [effect, f] = instr.input
    this._frames.push(FiberFrame.MapCauseFrame(f))
    this.setInstr(effect)
  }

  protected Match(instr: Effect.MatchCause<any, any, any, any, any, any, any, any, any>) {
    const [effect, f, g] = instr.input
    this._frames.push(FiberFrame.OrElseCauseFrame(f), FiberFrame.FlatMapFrame(g))
    this.setInstr(effect)
  }

  protected Now(instr: Effect.Now<any>) {
    this.continueWith(instr.input)
  }

  protected OrElse(instr: Effect.OrElseCause<any, any, any, any, any, any>) {
    const [effect, f] = instr.input
    this._frames.push(FiberFrame.OrElseCauseFrame(f))
    this.setInstr(effect)
  }

  protected ProvideContext(instr: Effect.ProvideContext<any, any, any>) {
    const [effect, context] = instr.input
    this._frames.push(FiberFrame.PopFrame(this.pushPopContext(context)))
    this.setInstr(effect)
  }

  protected ProvideFiberRefs(instr: Effect.ProvideFiberRefs<any, any, any>) {
    const [effect, fiberRefs] = instr.input
    this._frames.push(FiberFrame.PopFrame(this.pushPopFiberRefs(fiberRefs)))
    this.setInstr(effect)
  }

  protected ProvideRuntimeFlags(instr: Effect.ProvideRuntimeFlags<any, any, any>) {
    const [effect, flags] = instr.input
    this._frames.push(FiberFrame.PopFrame(this.pushPopRuntimeFlags(flags)))
    this.setInstr(effect)
  }

  protected ProvideTrace(instr: Effect.ProvideTrace<any, any, any>) {
    const [effect, trace, type] = instr.input

    if (type === 'stack') {
      this._frames.push(FiberFrame.PopFrame(this.pushPopTrace(trace)))
    } else {
      this._executionTrace.push(trace)
    }

    this.setInstr(effect)
  }

  protected Tap(instr: Effect.Tap<any, any, any, any, any, any>) {
    const [effect, f] = instr.input
    this._frames.push(FiberFrame.TapFrame(f))
    this.setInstr(effect)
  }

  protected TapCause(instr: Effect.TapCause<any, any, any, any, any, any>) {
    const [effect, f] = instr.input
    this._frames.push(FiberFrame.TapCauseFrame(f))
    this.setInstr(effect)
  }

  protected Wait(instr: Effect.Wait<any, any, any>) {
    const future = instr.input

    if (future.state._tag === 'Resolved') {
      this.setInstr(future.state.effect)
    } else {
      this.setInstr(null)

      this.addDisposable((remove) =>
        future.addObserver((effect) => {
          remove()
          this.setInstr(effect)
          this.loop()
        }),
      )
    }
  }

  protected WithContext(instr: Effect.WithContext<any, any, any, any>) {
    this.setInstr(instr.input(this.getContext()))
  }

  protected WithCurrentFiber(instr: Effect.WithCurrentFiber<any, any, any>) {
    this.setInstr(instr.input(this))
  }

  protected WithFiberRefs(instr: Effect.WithFiberRefs<any, any, any>) {
    this.setInstr(instr.input(this.getFiberRefs()))
  }

  protected WithPlatform(instr: Effect.WithPlatform<any, any, any>) {
    this.setInstr(instr.input(this.options.platform))
  }

  protected WithRuntimeFlags(instr: Effect.WithRuntimeFlags<any, any, any>) {
    this.setInstr(instr.input(this.getRuntimeFlags()))
  }

  protected WithRuntimeOptions(instr: Effect.WithRuntimeOptions<any, any, any>) {
    this.setInstr(instr.input(this.getRuntimeOptions()))
  }

  protected getRuntimeOptions(): RuntimeOptions<any> {
    return {
      context: this.getContext(),
      fiberRefs: this.getFiberRefs(),
      flags: this.getRuntimeFlags(),
      id: this.options.id,
      platform: this.options.platform,
      scope: this.options.scope,
      parent: this.options.parent,
    }
  }

  protected getContext(): Context.Context<any> {
    return this._context.current
  }

  protected pushPopContext(ctx: Context.Context<any>) {
    this._context.push(ctx)

    return () => this._context.pop()
  }

  protected getFiberRefs(): FiberRefs {
    return this._fiberRefs.current
  }

  protected pushPopFiberRefs(fiberRefs: FiberRefs) {
    this._fiberRefs.push(fiberRefs)

    return () => this._fiberRefs.pop()
  }

  protected getRuntimeFlags(): RuntimeFlags {
    return this._flags.current
  }

  protected pushPopRuntimeFlags(flags: RuntimeFlags) {
    this._flags.push(flags)

    return () => this._flags.pop()
  }

  protected getTrace(): Effect.Effect.Trace {
    // TODO
    return {} as any
  }

  protected pushPopTrace(trace: Trace.Trace) {
    this._stackTrace.push(trace)

    return () => this._stackTrace.pop()
  }

  protected setInstr(instr: Effect.Effect<any, any, any> | null) {
    this._instr = instr as Effect.Effect.Instruction | null
  }

  protected addDisposable(f: (remove: () => void) => Disposable.Disposable): Disposable.Disposable {
    const inner = Disposable.Queue()
    inner.offer(f(inner.dispose))
    inner.offer(this._disposable.offer(inner))
    return inner
  }
}
