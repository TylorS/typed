import * as E from 'fp-ts/Either'

import { Settable } from '@/Cancelable/settable'
import { Exit } from '@/Exit'

import { DefaultScope } from '../DefaultScope'
import { Fx } from '../Fx'
import { Instruction } from '../Instruction'
import { RuntimeInstruction } from '../RuntimeInstruction'
import { Scope } from '../Scope'
import { InstructionNode } from '.'
import { createFiber } from './createFiber'
import { InstructionTree } from './InstructionTree'
import { isPromiseLike } from './isPromiseLike'

/**
 * The InstructionProcessor is responsible for incrementally processing Fx's Instruction set
 * with stack-safety. Because InstructionProcessor relies on Generators
 */
export class InstructionProcessor<R, A> {
  current: InstructionTree<R, any> | undefined
  stack: Array<Instruction<R, any>> = []

  constructor(readonly fx: Fx<R, A>, readonly requirements: R, readonly scope: Scope) {
    this.current = {
      type: 'Initial',
      fx,
    }
  }

  *process(): Generator<RuntimeInstruction<R, A>, void> {
    // Process nodes for as long as there is anything process and the scope has not been closed.
    while (this.current !== undefined && !this.scope.isClosed()) {
      yield* this.#processNode(this.current)
    }
  }

  *#processNode<A>(node: InstructionTree<R, A>): Generator<RuntimeInstruction<R, any>, void> {
    switch (node.type) {
      case 'Initial': {
        this.current = {
          type: 'Generator',
          generator: node.fx[Symbol.iterator](),
          previous: node,
        }

        break
      }

      case 'Generator': {
        const { generator, previous } = node
        const result = generator.next(node.next)

        // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
        if (!result.done) {
          this.current = {
            type: 'Instruction',
            instruction: result.value,
            previous: node,
          }

          break
        }

        const computed = result.value

        // Exit if you have computed your final value
        if (previous.type === 'Initial') {
          yield* this.#exitNow(E.right(computed as any))

          break
        }

        if (previous.type === 'Generator') {
          previous.next = computed
        }

        this.current = node.previous

        break
      }

      case 'Instruction': {
        const { instruction, previous } = node

        switch (instruction.type) {
          case 'Access': {
            const fx = instruction.access(this.requirements)

            this.current = {
              type: 'Generator',
              generator: fx[Symbol.iterator](),
              previous,
            }

            break
          }

          case 'FlatMap': {
            const { fx, f } = instruction
            const exit = yield* this.#runExit(fx)

            if (E.isRight(exit)) {
              const fx = f(exit.right)

              this.current = {
                type: 'Generator',
                generator: fx[Symbol.iterator](),
                previous,
              }

              break
            }

            yield* this.#exitNow(exit)

            break
          }

          case 'FromAsync': {
            const inner = new Settable()
            const { cancel } = this.scope.trackResources(inner)

            const a = yield {
              type: 'Promise',
              promise: new Promise((resolve) => {
                inner.add(instruction.async(resolve))
              }),
            }

            const x = cancel()

            // Only add asynchrony when required
            if (isPromiseLike(x)) {
              yield {
                type: 'Promise',
                promise: x,
              }
            }

            node.previous.next = a

            this.current = node.previous

            break
          }

          case 'FromExit': {
            const { exit } = instruction

            yield* this.#maybeExit(node, exit)

            break
          }

          case 'FromIO': {
            node.previous.next = instruction.io()

            this.current = node.previous

            break
          }

          case 'FromPromise': {
            node.previous.next = yield { type: 'Promise', promise: instruction.promise() }

            this.current = node.previous

            break
          }

          case 'Parallel':
          case 'Race': {
            node.previous.next = yield {
              type: instruction.type,
              scope: this.scope,
              requirements: this.requirements,
              fxs: instruction.fxs,
            }
            this.current = node.previous

            break
          }

          case 'Success': {
            node.previous.next = instruction.value

            this.current = node.previous

            break
          }

          case 'DeleteFiberRef': {
            const fx = this.scope.deleteFiberRef(instruction.fiberRef)

            this.current = {
              type: 'Generator',
              generator: fx[Symbol.iterator]() as Generator<Instruction<R, any>, any>,
              previous,
            }

            break
          }

          case 'GetFiberRef': {
            const fx = this.scope.getFiberRef(instruction.fiberRef)

            this.current = {
              type: 'Generator',
              generator: fx[Symbol.iterator]() as Generator<Instruction<R, any>, any>,
              previous,
            }

            break
          }

          case 'UpdateFiberRef': {
            const fx = this.scope.updateFiberRef(instruction.fiberRef, instruction.f)

            this.current = {
              type: 'Generator',
              generator: fx[Symbol.iterator](),
              previous,
            }

            break
          }

          case 'Fork': {
            node.previous.next = createFiber(
              instruction.fx,
              this.requirements,
              forkScope(instruction.scope ?? this.scope),
            )

            this.current = node.previous

            break
          }

          case 'Join': {
            const { fiber } = instruction
            const exitFiber = yield* this.#joinExit(fiber.exit)

            if (E.isRight(exitFiber)) {
              const exitScope = yield* this.#runExit(fiber.scope)

              if (E.isLeft(exitScope)) {
                return yield* this.#maybeExit(node, exitScope)
              }

              const fiberScope = exitScope.right

              // Rejoin references when rejoining a Fiber
              this.scope.inheritRefs(fiberScope.references)
              // Ensure resources are tracked through to the parent now
              this.scope.trackResources(fiberScope)
            }

            yield* this.#maybeExit(node, exitFiber)

            break
          }

          case 'Kill': {
            const x = instruction.fiber.cancel()

            if (isPromiseLike(x)) {
              yield { type: 'Promise', promise: x as any }
            }

            break
          }

          case 'GetScope': {
            node.previous.next = this.scope

            this.current = node.previous

            break
          }
        }

        break
      }
    }
  }

  // Capture the Exit value of an internal Fx
  *#runExit<A>(fx: Fx<R, A>): Generator<RuntimeInstruction<R, any>, Exit<A>> {
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

  // Capture the Exit value of an internal Fx
  *#joinExit(fx: Fx<unknown, Exit<any>>): Generator<RuntimeInstruction<R, any>, Exit<any>> {
    return E.flatten(yield* this.#runExit(fx))
  }

  *#exitNow(exit: Exit<A>): Generator<RuntimeInstruction<R, any>, void> {
    this.current = undefined

    yield { type: 'Exit', exit }
  }

  *#maybeExit(
    node: InstructionNode<R>,
    exit: Exit<A>,
  ): Generator<RuntimeInstruction<R, any>, void> {
    if (E.isRight(exit)) {
      node.previous.next = exit.right

      this.current = node.previous

      return
    }

    yield* this.#exitNow(exit)
  }
}

export function forkScope(scope: Scope): Scope {
  return new DefaultScope({
    references: scope.cloneReferences(),
  })
}
