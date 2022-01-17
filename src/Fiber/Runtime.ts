import { match } from 'fp-ts/Either'
import { fromNullable } from 'fp-ts/Option'
import { Equals } from 'ts-toolbelt/out/Any/Equals'

import { Cause, prettyPrint, Renderer } from '@/Cause'
import { Context, make } from '@/Context'
import { Disposable } from '@/Disposable'
import { ask } from '@/Effect/Access'
import { getContext } from '@/Effect/GetContext'
import { getScope } from '@/Effect/GetScope'
import { getTrace } from '@/Effect/Trace'
import { Exit } from '@/Exit'
import { EFx, Fx } from '@/Fx'
import { MutableRef } from '@/MutableRef'
import { extendScope, LocalScope, Scope } from '@/Scope'
import { Trace } from '@/Trace'

// eslint-disable-next-line import/no-cycle
import { defaultProcessors } from './defaultProcessors'
import { Fiber } from './Fiber'
import { fromProcessor } from './fromProcessor'
import { InstructionProcessor, Processors } from './InstructionProcessor'

export class Runtime<R> {
  constructor(readonly resources: R, readonly options: RuntimeOptions = {}) {}

  readonly runFiber = <E, A>(fx: Fx<R, E, A>): Fiber<E, A> => {
    const procesor = this.makeProcessor(fx)

    procesor.processLater()

    return fromProcessor(procesor)
  }

  readonly run = <E, A>(fx: Fx<R, E, A>, onExit: (exit: Exit<E, A>) => void) => {
    const procesor = this.makeProcessor(fx)

    procesor.addObserver(onExit)
    procesor.processNow()
  }

  readonly runDisposable = <E, A>(
    fx: Fx<R, E, A>,
    onExit: (exit: Exit<E, A>) => void,
  ): Disposable => {
    const procesor = this.makeProcessor(fx)

    procesor.addObserver(onExit)
    procesor.processLater()

    return procesor
  }

  readonly runPromiseExit = <E, A>(fx: Fx<R, E, A>) =>
    new Promise<Exit<E, A>>((resolve) => {
      const procesor = this.makeProcessor(fx)

      procesor.addObserver(resolve)
      procesor.processNow()
    })

  readonly runPromise = <E, A>(fx: Fx<R, E, A>) =>
    new Promise<A>((resolve, reject) => {
      const procesor = this.makeProcessor(fx)

      procesor.addObserver(
        match((cause) => reject(new Error(prettyPrint(cause, procesor.context.renderer))), resolve),
      )

      procesor.processNow()
    })

  readonly makeProcessor = <E, A>(fx: Fx<R, E, A>) => {
    const context =
      this.options.context ??
      make<E>({
        sequenceNumber: this.options.sequenceNumber,
        renderer: this.options.renderer,
        reportFailure: this.options.reportError,
      })
    const scope = this.options.scope ? extendScope(this.options.scope) : new LocalScope()
    const parentTrace = fromNullable(this.options.parentTrace)
    // Default to lazy-loading processors on-demand
    const processors = this.options.processors ?? defaultProcessors

    return new InstructionProcessor<R, E, A>(
      fx,
      this.resources,
      context,
      scope,
      processors,
      parentTrace,
      this.options.shouldTrace,
      this.options.maxOps,
    )
  }
}

export interface RuntimeOptions {
  readonly context?: Context<any>
  readonly scope?: Scope<any, any>
  readonly parentTrace?: Trace
  readonly sequenceNumber?: MutableRef<number>
  readonly renderer?: Renderer<any>
  readonly reportError?: (cause: Cause<any>) => void
  readonly processors?: Processors
  readonly shouldTrace?: boolean
  readonly maxOps?: number
}

export const currentRuntime = <R, E = never>(options: RuntimeOptions = {}) =>
  Fx(function* () {
    const r = yield* ask<R>()
    const context = yield* getContext<E>()
    const scope = yield* getScope<E>()
    const parentTrace = yield* getTrace

    return new Runtime(r, { context, scope, parentTrace, ...options })
  })

export const isolatedRuntime = <R, E = never>(options: RuntimeOptions = {}) =>
  Fx(function* () {
    const r = yield* ask<R>()
    const context = yield* getContext<E>()
    const scope = yield* getScope<E>()
    const parentTrace = yield* getTrace

    return new Runtime(r, {
      scope,
      parentTrace,
      sequenceNumber: context.sequenceNumber,
      renderer: context.renderer,
      reportError: context.reportFailure,
      ...options,
    })
  })

export const runMain = <E, A>(
  fx: EnsureEmptyResources<EFx<E, A>>,
  options: RuntimeOptions = {},
): Promise<A> => {
  const runtime = new Runtime({}, options)

  return runtime.runPromise(fx)
}

export const runMainExit = <E, A>(
  fx: EnsureEmptyResources<EFx<E, A>>,
  options: RuntimeOptions = {},
): Promise<Exit<E, A>> => {
  const runtime = new Runtime({}, options)

  return runtime.runPromiseExit(fx)
}

export const runMainFiber = <E, A>(
  fx: EnsureEmptyResources<EFx<E, A>>,
  options: RuntimeOptions = {},
): Fiber<E, A> => {
  const runtime = new Runtime({}, options)

  return runtime.runFiber(fx)
}

export const runMainDisposable = <E, A>(
  fx: EnsureEmptyResources<EFx<E, A>>,
  onExit: (exit: Exit<E, A>) => void,
  options: RuntimeOptions = {},
): Disposable => {
  const runtime = new Runtime({}, options)

  return runtime.runDisposable(fx, onExit)
}

export type EnsureEmptyResources<T> = [T] extends [Fx<infer R, infer E, infer A>]
  ? Equals<R, unknown> extends 1
    ? EFx<E, A>
    : never
  : never
