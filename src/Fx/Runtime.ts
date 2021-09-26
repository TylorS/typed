import * as Either from 'fp-ts/Either'
import { flow } from 'fp-ts/lib/function'

import * as Async from '@/Async'
import { Cancelable } from '@/Cancelable'
import { Settable } from '@/Cancelable/settable'
import { interrupted, isCause, unexpected } from '@/Cause'
import { Exit } from '@/Exit'

import { Fx, OutputOf, RequirementsOf } from './Fx'
import { InstructionProcessor } from './InstructionProcessor'
import { isPromiseLike } from './isPromiseLike'
import { Scope } from './Scope'

export type RuntimeInstruction<R, E, A> =
  | ExitInstruction<E, A>
  | PromiseInstruction<A>
  | AsyncInstruction<A>
  | ParallelInstruction<R, E>
  | RaceInstruction<R, E>

export interface ExitInstruction<E, A> {
  readonly type: 'Exit'
  readonly exit: Exit<E, A>
}

export interface PromiseInstruction<A> {
  readonly type: 'Promise'
  readonly promise: Promise<A>
}

export interface AsyncInstruction<A> {
  readonly type: 'Async'
  readonly async: Async.Async<A>
}

export interface ParallelInstruction<R, E> {
  readonly type: 'Parallel'
  readonly scope: Scope
  readonly requirements: R
  readonly fxs: ReadonlyArray<Fx<R, E, any>>
}

export interface RaceInstruction<R, E> {
  readonly type: 'Race'
  readonly scope: Scope
  readonly requirements: R
  readonly fxs: ReadonlyArray<Fx<R, E, any>>
}

export class Runtime<R, E, A> {
  constructor(readonly fx: Fx<R, E, A>) {}

  // Runs an Fx and tears down the current scope before Exit.
  runMain = (scope: Scope, requirements: R, onExit: (exit: Exit<E, A>) => void): Cancelable =>
    this.runFx(scope, requirements, createMainExit(scope, onExit))

  // Runs an Fx without tearing down the current scope on Exit.
  runFx = (scope: Scope, requirements: R, onExit: (exit: Exit<E, A>) => void): Cancelable => {
    const processor = new InstructionProcessor(this.fx, requirements, scope)
    const generator = processor.process()

    processRuntimeInstructions(generator, generator.next(), onExit, scope).catch((error) =>
      onExit(Either.left(isCause(error) ? error : unexpected(error))),
    )

    return {
      cancel: () => scope.close(),
    }
  }
}

async function runPromise_<F extends Fx<any, any, any>>(
  fx: F,
  requirements: RequirementsOf<F>,
  scope: Scope,
): Promise<OutputOf<F>> {
  return await new Promise<OutputOf<F>>((resolve, reject) => {
    new Runtime(fx).runFx(scope, requirements, Either.matchW(reject, resolve))
  })
}

// Implements runtime instructions which the Instruction Processor can delegate asynchronous
// effects to.
async function processRuntimeInstructions<R, E, A>(
  generator: Generator<RuntimeInstruction<R, E, A>, void, unknown>,
  result: IteratorResult<RuntimeInstruction<R, E, A>, void>,
  onExit: (exit: Exit<E, A>) => void | Promise<void>,
  scope: Scope,
): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
  while (!result.done) {
    const instruction = result.value

    switch (instruction.type) {
      case 'Exit': {
        const x = onExit(instruction.exit)

        // Only add asynchrony when required
        if (isPromiseLike(x)) {
          return await x
        }

        return x
      }

      case 'Promise': {
        result = generator.next(await instruction.promise)

        break
      }

      case 'Async': {
        const inner = new Settable()
        const { cancel } = scope.trackResources(inner)

        const a = await new Promise((resolve) => {
          inner.add(instruction.async(resolve))
        })

        const x = cancel()

        // Only add asynchrony when required
        if (isPromiseLike(x)) {
          await x
        }

        result = generator.next(a)

        break
      }

      case 'Parallel': {
        const { fxs, scope, requirements } = instruction

        const values = await Promise.all(
          fxs.map(async (fx) => await runPromise_(fx, requirements, scope)),
        )

        result = generator.next(values)

        break
      }

      case 'Race': {
        const { fxs, scope, requirements } = instruction

        const values = await Promise.race(
          fxs.map(async (fx) => await runPromise_(fx, requirements, scope)),
        )

        result = generator.next(values)

        break
      }
    }
  }
}

/**
 * Exit and close the current scope.
 */
function createMainExit<E, A>(
  scope: Scope,
  onExit: (exit: Exit<E, A>) => void,
): (exit: Exit<E, A>) => void {
  let hasExited = false

  scope.trackResources({ cancel: () => exitOnce(Either.left(interrupted)) })

  function exitOnce(exit: Exit<E, A>): void {
    if (hasExited) {
      return
    }

    hasExited = true

    const x = scope.close()

    if (isPromiseLike(x)) {
      return void x.then(
        () => onExit(exit),
        flow((x) => (isCause(x) ? x : unexpected(x)), Either.left, onExit),
      )
    }

    onExit(exit)
  }

  return exitOnce
}
