import * as Either from 'fp-ts/Either'
import { pipe } from 'fp-ts/function'

import { Cancelable } from '@/Cancelable'
import { isCause, unexpected } from '@/Cause'
import { Exit } from '@/Exit'

import { Fx, OutputOf, RequirementsOf } from '../Fx'
import { Runtime } from '../Runtime'
import { RuntimeInstruction } from '../RuntimeInstruction'
import { Scope } from '../Scope'
import { createMainExit } from './createMainExit'
import { InstructionProcessor } from './InstructionProcessor'

export class DefaultRuntime implements Runtime {
  runMain = <R, A>(
    fx: Fx<R, A>,
    scope: Scope,
    requirements: R,
    onExit: (exit: Exit<A>) => void,
  ): Cancelable => this.runFx(fx, scope, requirements, createMainExit(scope, onExit))

  // Runs an Fx without tearing down that scope on Exit.
  runFx = <R, A>(
    fx: Fx<R, A>,
    scope: Scope,
    requirements: R,
    onExit: (exit: Exit<A>) => void,
  ): Cancelable => {
    const processor = new InstructionProcessor(fx, requirements, scope)
    const generator = processor.process()

    processRuntimeInstructions(generator, generator.next(), onExit).catch((error) =>
      onExit(Either.left(isCause(error) ? error : unexpected(error))),
    )

    return {
      cancel: () => scope.cancel(),
    }
  }
}

export async function processRuntimeInstructions<R, A>(
  generator: Generator<RuntimeInstruction<R, A>, void, unknown>,
  result: IteratorResult<RuntimeInstruction<R, A>, void>,
  onExit: (exit: Exit<A>) => void,
): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
  while (!result.done) {
    const instruction = result.value

    switch (instruction.type) {
      case 'Exit': {
        return onExit(instruction.exit)
      }

      case 'Promise': {
        result = generator.next(await instruction.promise)

        break
      }

      // TODO: support synchronous effects here
      case 'Parallel': {
        const { fxs, scope, requirements } = instruction

        const values = await Promise.all(
          fxs.map(async (fx) => await runPromise_(fx, requirements, scope)),
        )

        result = generator.next(values)

        break
      }

      // TODO: support synchronous effects here
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

export async function runPromise_<F extends Fx<any, any>>(
  fx: F,
  requirements: RequirementsOf<F>,
  scope: Scope,
): Promise<OutputOf<F>> {
  return await new Promise<OutputOf<F>>((resolve, reject) => {
    new DefaultRuntime().runFx(fx, scope, requirements, (e) =>
      pipe(e, Either.matchW(reject, resolve)),
    )
  })
}
