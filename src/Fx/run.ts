import { Disposable } from '@/Disposable'
import { Exit } from '@/Exit'
import { Fiber, Runtime } from '@/Fiber'
import * as F from '@/Fiber/Runtime'

import { EFx, Fx } from './Fx'

export const runMain: <E, A>(fx: EFx<E, A>, options?: F.RuntimeOptions<E>) => Promise<A> = F.runMain

export const runMainDisposable: <E, A>(
  fx: EFx<E, A>,
  onExit: (exit: Exit<E, A>) => void,
  options?: F.RuntimeOptions<E>,
) => Disposable = F.runMainDisposable

export const runMainExit: <E, A>(
  fx: EFx<E, A>,
  options?: F.RuntimeOptions<E>,
) => Promise<Exit<E, A>> = F.runMainExit

export const runMainFiber: <E, A>(fx: EFx<E, A>, options?: F.RuntimeOptions<E>) => Fiber<E, A> =
  F.runMainFiber

export const currentRuntime = F.currentRuntime
export const isolatedRuntime = F.isolatedRuntime

export const runPromise =
  <R, E>(resources: R, options?: F.RuntimeOptions<E>) =>
  <E, A>(fx: Fx<R, E, A>): Promise<A> => {
    const runtime = new Runtime(resources, options)

    return runtime.runPromise(fx)
  }

export const runPromiseExit =
  <R, E>(resources: R, options?: F.RuntimeOptions<E>) =>
  <A>(fx: Fx<R, E, A>): Promise<Exit<E, A>> => {
    const runtime = new Runtime(resources, options)

    return runtime.runPromiseExit(fx)
  }

export const runTrace = <R, E, A>(
  fx: Fx<R, E, A>,
  resources: R,
  options: F.RuntimeOptions<E> = {},
): Promise<A> => {
  const runtime = new Runtime(resources, {
    ...options,
    shouldTrace: true,
  })

  return runtime.runPromise(fx)
}

export const runTraceExit = <R, E, A>(
  fx: Fx<R, E, A>,
  resources: R,
  options: F.RuntimeOptions<E> = {},
): Promise<Exit<E, A>> => {
  const runtime = new Runtime(resources, {
    ...options,
    shouldTrace: true,
  })

  return runtime.runPromiseExit(fx)
}
