import { match } from 'fp-ts/Either'
import { none, Option } from 'fp-ts/Option'

import { prettyPrint } from '@/Cause'
import { Disposable } from '@/Disposable'
import { ask, getContext, getScope } from '@/Effect'
import { Exit } from '@/Exit'
import * as Context from '@/FiberContext'
import { makeFiberRefLocals } from '@/FiberRef'
import { EFx, Fx } from '@/Fx'
import * as Scheduler from '@/Scheduler'
import { extendScope, LocalScope, Scope } from '@/Scope'
import { Trace } from '@/Trace'

import { eagerProcessors } from './eagerProcessors'
import { fromInstructionProcessor } from './fromInstructionProcessor'
import { InstructionProcessor } from './InstructionProcessor'
import { Processors } from './Processor'
import { RuntimeProcessor } from './RuntimeProcessor'

export interface RuntimeOptions<E> extends Partial<Context.FiberContextOptions<E>> {
  readonly fiberContext?: Context.FiberContext<E>
  readonly scope?: Scope<E, any>
  readonly processors?: Processors
  readonly parentTrace?: Option<Trace>
  readonly shouldTrace?: boolean
  readonly maxOps?: number
}

export class Runtime<R, E> {
  constructor(readonly resources: R, readonly options: RuntimeOptions<E> = {}) {}

  readonly run = <B>(
    fx: Fx<R, E, B>,
    onExit: (exit: Exit<E, B>) => void,
    options: RuntimeOptions<E> = {},
  ): Disposable => {
    const processor = this.makeProcessor(fx, options)
    const runtime = new RuntimeProcessor(
      processor,
      processor.captureStackTrace,
      processor.shouldTrace,
      processor.scope.interruptableStatus,
    )

    runtime.addObserver(onExit)
    runtime.processNow()

    return runtime
  }

  readonly runPromise = <E, B>(fx: Fx<R, E, B>, options: RuntimeOptions<E> = {}): Promise<B> =>
    new Promise((resolve, reject) => {
      const processor = this.makeProcessor(fx, options)
      const runtime = new RuntimeProcessor(
        processor,
        processor.captureStackTrace,
        processor.shouldTrace,
        processor.scope.interruptableStatus,
      )

      runtime.addObserver(
        match(
          (cause) => reject(new Error(prettyPrint(cause, processor.fiberContext.renderer))),
          resolve,
        ),
      )
      runtime.processNow()
    })

  readonly runPromiseExit = <E, B>(
    fx: Fx<R, E, B>,
    options: RuntimeOptions<E> = {},
  ): Promise<Exit<E, B>> =>
    new Promise((resolve) => {
      const processor = this.makeProcessor(fx, options)
      const runtime = new RuntimeProcessor(
        processor,
        processor.captureStackTrace,
        processor.shouldTrace,
        processor.scope.interruptableStatus,
      )

      runtime.addObserver(resolve)
      runtime.processNow()
    })

  readonly runFiber = <E, B>(fx: Fx<R, E, B>, options: RuntimeOptions<E> = {}) =>
    fromInstructionProcessor(
      this.makeProcessor(fx, options),
      (r) => r.processLater() /* Always start the processor asynchronously */,
    )

  readonly makeProcessor = <E, B>(
    fx: Fx<R, E, B>,
    overrides?: RuntimeOptions<E>,
  ): InstructionProcessor<R, E, B> => {
    const options = { ...this.options, ...overrides } as RuntimeOptions<E>

    return new InstructionProcessor<R, E, B>(
      fx,
      this.resources,
      options.fiberContext ??
        Context.make<E>({
          ...options,
          scheduler: options.scheduler ?? Scheduler.make({ runtimeOptions: { shouldTrace: true } }),
        }),
      options.scope ? extendScope(options.scope) : new LocalScope(),
      options.processors ?? eagerProcessors,
      options.parentTrace ?? none,
      options.shouldTrace ?? false,
      options.maxOps ?? 2048,
    )
  }
}

export const runMain = <E, A>(fx: EFx<E, A>, options: RuntimeOptions<E> = {}) => {
  const runtime = new Runtime({}, options)

  return runtime.runPromise(fx)
}

export const runMainExit = <E, A>(fx: EFx<E, A>, options: RuntimeOptions<E> = {}) => {
  const runtime = new Runtime({}, options)

  return runtime.runPromiseExit(fx)
}

export const runMainFiber = <E, A>(fx: EFx<E, A>, options: RuntimeOptions<E> = {}) => {
  const runtime = new Runtime({}, options)

  return runtime.runFiber(fx)
}

export const runMainDisposable = <E, A>(
  fx: EFx<E, A>,
  onExit: (exit: Exit<E, A>) => void,
  options: RuntimeOptions<E> = {},
): Disposable => {
  const processor = new Runtime({}, options).makeProcessor(fx)
  const runtime = new RuntimeProcessor(
    processor,
    processor.captureStackTrace,
    processor.shouldTrace,
    processor.scope.interruptableStatus,
  )

  runtime.addObserver(onExit)
  runtime.processLater()

  return runtime
}

export const currentRuntime = <R, E>(
  options: Omit<RuntimeOptions<E>, 'context' | 'scope'> = {},
  trace = 'currentRuntime',
) =>
  Fx(function* () {
    const resources = yield* ask<R>(trace)
    const context = yield* getContext<E>(trace)
    const scope = yield* getScope<E>(trace)

    return new Runtime(resources, {
      ...options,
      fiberContext: context,
      scope,
    })
  })

export const isolatedRuntime = <R, E>(
  options: Omit<RuntimeOptions<E>, 'context' | 'scope'> = {},
  trace = 'isolatedRuntime',
) =>
  Fx(function* () {
    const resources = yield* ask<R>(trace)
    const context = yield* getContext<E>(trace)
    const scope = yield* getScope<E>()

    return new Runtime(resources, {
      ...options,
      fiberContext: { ...context, locals: makeFiberRefLocals() },
      scope,
    })
  })
