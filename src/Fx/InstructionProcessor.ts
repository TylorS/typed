import * as E from 'fp-ts/Either'

import { Exit } from '@/Exit'

import { Fx, Instruction } from './Fx'
import { RuntimeInstruction } from './Runtime'
import { Scope } from './Scope'

/**
 * The InstructionProcessor is responsible for incrementally processing Fx's Instruction set
 * with stack-safety. Each
 */
export class InstructionProcessor<R, E, A> {
  context: Context<R, E, any> | undefined

  constructor(readonly fx: Fx<R, E, A>, readonly requirements: R, readonly scope: Scope) {
    this.context = {
      type: 'Initial',
      fx,
    }
  }

  *process(): Generator<RuntimeInstruction<R, E, A>, void> {
    while (this.context !== undefined) {
      yield* this.#processContext(this.context)
    }
  }

  *#processContext<A>(context: Context<R, E, A>): Generator<RuntimeInstruction<R, E, A>, void> {
    switch (context.type) {
      case 'Initial': {
        this.context = {
          type: 'Generator',
          generator: context.fx[Symbol.iterator](),
          previous: context,
        }

        break
      }

      case 'Generator': {
        const { generator, previous } = context
        const result = generator.next(context.next)

        // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
        if (!result.done) {
          this.context = {
            type: 'Instruction',
            instruction: result.value,
            previous: context,
          }

          break
        }

        const computed = result.value

        // Exit if you have computed your final value
        if (previous.type === 'Initial') {
          yield { type: 'Exit', exit: E.right(computed) }

          this.context = undefined

          break
        }

        previous.next = computed
        this.context = context.previous

        break
      }

      case 'Instruction': {
        const { instruction, previous } = context

        switch (instruction.type) {
          case 'Access': {
            const fx = instruction.access(this.requirements)
            const generator = fx[Symbol.iterator]()

            this.context = {
              type: 'Generator',
              generator,
              previous,
            }

            break
          }

          case 'FlatMap': {
            const { fx, f } = instruction
            const exit = yield* this.#runExit(fx)

            if (E.isRight(exit)) {
              this.context = {
                type: 'Generator',
                generator: f(exit.right)[Symbol.iterator](),
                previous,
              }

              break
            }

            yield { type: 'Exit', exit }

            break
          }

          case 'Fold': {
            const { fx, onLeft, onRight } = instruction

            const exit = yield* this.#runExit(fx)

            if (E.isRight(exit)) {
              this.context = {
                type: 'Generator',
                generator: onRight(exit.right)[Symbol.iterator](),
                previous,
              }

              break
            }

            const cause = exit.left

            if (cause.type === 'Expected') {
              this.context = {
                type: 'Generator',
                generator: onLeft(cause.error)[Symbol.iterator](),
                previous,
              }

              break
            }

            yield { type: 'Exit', exit }

            break
          }

          case 'FromAsync': {
            context.previous.next = yield { type: 'Async', async: instruction.async }

            this.context = context.previous

            break
          }

          case 'FromExit': {
            const { exit } = instruction

            if (E.isRight(exit)) {
              context.previous.next = exit.right

              this.context = context.previous

              break
            }

            yield { type: 'Exit', exit }

            break
          }

          case 'FromIO': {
            context.previous.next = instruction.io()

            this.context = context.previous

            break
          }

          case 'FromPromise': {
            context.previous.next = yield { type: 'Promise', promise: instruction.promise() }

            this.context = context.previous

            break
          }

          case 'Parallel':
          case 'Race': {
            context.previous.next = yield {
              type: instruction.type,
              scope: this.scope,
              requirements: this.requirements,
              fxs: instruction.fxs,
            }
            this.context = context.previous

            break
          }

          case 'Success': {
            context.previous.next = instruction.value

            this.context = context.previous

            break
          }
        }

        break
      }
    }
  }

  // Capture the Exit value of an internal Fx
  *#runExit<A>(fx: Fx<R, E, A>): Generator<RuntimeInstruction<R, E, A>, Exit<E, A>> {
    const processor = new InstructionProcessor(fx, this.requirements, this.scope)

    for (const instruction of processor.process()) {
      switch (instruction.type) {
        case 'Exit':
          return instruction.exit
        default:
          yield instruction
      }
    }

    throw new Error(`Fx must exit!`)
  }
}

export type Context<R, E, A> =
  | InitialContext<R, E, A>
  | GeneratorContext<R, E, A>
  | InstructionContext<R, E>

export interface InitialContext<R, E, A> {
  readonly type: 'Initial'
  readonly fx: Fx<R, E, A>
}

export interface GeneratorContext<R, E, A> {
  readonly type: 'Generator'
  readonly generator: Generator<Instruction<R, E, any>, A>
  readonly previous: GeneratorContext<any, any, any> | InitialContext<any, any, any>

  // Mutable reference to value that should be nexted into
  next?: any
}

export interface InstructionContext<R, E> {
  readonly type: 'Instruction'
  readonly instruction: Instruction<R, E, any>
  readonly previous: GeneratorContext<R, E, any>
}
