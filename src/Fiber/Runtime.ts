/* eslint-disable @typescript-eslint/strict-boolean-expressions */
/* eslint-disable @typescript-eslint/explicit-function-return-type */

import { isLeft, left, right } from 'fp-ts/Either'
import { pipe } from 'fp-ts/function'
import { isSome } from 'fp-ts/Option'

import { Unexpected } from '@/Cause'
import * as Context from '@/Context'
import { handle } from '@/Effect'
import { Exit } from '@/Exit'
import { Fx } from '@/Fx'
import * as MutableRef from '@/MutableRef'
import * as Scope from '@/Scope'
import { drain } from '@/Stream'

import { Status } from './Fiber'
import {
  ForkOptions,
  FromAsync,
  FromCause,
  fromCause,
  FromPromise,
  fromPromise,
  Suspend,
} from './Instruction'
import { makeRuntimeFiber } from './makeFiber'

type RuntimeInstruction = FromCause | FromAsync<any> | FromPromise<any> | Suspend

export class Runtime<R, A> {
  private node: RuntimeTree<any> | undefined
  readonly status: MutableRef.MutableRef<Status> = MutableRef.make<Status>({ type: 'Suspended' })

  constructor(
    private readonly fx: Fx<R, A>,
    private readonly scope: Scope.LocalScope<R, A>,
    private readonly context: Context.Context,
  ) {}

  start(): void {
    void Promise.resolve()
      .then(() => {
        this.node = {
          type: 'Generator',
          generator: handleSyncInstructions(this.fx, this.scope, this.context),
          next: MutableRef.make<any>(undefined),
          previous: null,
        }

        this.#process()
      })
      .catch((error) => this.#exit(left(Unexpected(error))))
  }

  #process() {
    if (this.node) {
      this.#processNode(this.node)
    }
  }

  #processNode(node: RuntimeTree<any>): void {
    runningStatus(this.status)

    if (node.type === 'Instruction') {
      return this.#processInstruction(node)
    }

    const result = node.generator.next(node.next.get())

    if (!result.done) {
      this.node = {
        type: 'Instruction',
        instruction: result.value,
        previous: node,
      }

      this.#process()

      return
    }

    // We're finished processing this Fx
    if (!node.previous) {
      this.#exit(right(result.value))

      return
    }

    node.previous.next.set(result.value)

    this.node = node.previous

    this.#process()
  }

  #processInstruction({ instruction, previous }: InstructionNode): void {
    switch (instruction.type) {
      case 'FromAsync': {
        const disposable = instruction.input((a) => {
          previous.next.set(a)

          this.node = previous

          dispose()

          this.#process()
        })

        const option = pipe(
          this.scope,
          Scope.ensure(() => fromPromise(async () => await disposable.dispose())),
        )

        const dispose = () => {
          if (isSome(option)) {
            this.scope.finalizers.delete(option.value)
          }
        }

        break
      }

      case 'FromCause': {
        this.#exit(left(instruction.input))

        break
      }

      case 'FromPromise': {
        void instruction
          .input()
          .then((a) => {
            previous.next.set(a)

            this.node = previous

            this.#process()
          })
          .catch((error) => this.#exit(left(Unexpected(error))))

        break
      }
      case 'Suspend': {
        suspendedStatus(this.status)

        void Promise.resolve()
          .then(() => {
            this.node = previous
            this.#process()
          })
          .catch((error) => {
            this.#exit(left(Unexpected(error)))
          })

        break
      }
    }
  }

  #exit(exit: Exit<A>): void {
    const { open } = Scope.checkStatus(this.scope)

    if (!open) {
      return
    }

    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this
    const fx = Fx(function* () {
      const closed = yield* pipe(self.scope, Scope.close(exit))

      self.status.set({ type: isLeft(exit) ? 'Failed' : 'Completed' })

      return closed
    })

    this.node = {
      type: 'Generator',
      generator: handleSyncInstructions(fx, this.scope as any, this.context),
      next: MutableRef.make<any>(undefined),
      previous: null,
    }

    this.#process()
  }
}

type RuntimeTree<A> = GeneratorNode<A> | InstructionNode

interface GeneratorNode<A> {
  readonly type: 'Generator'
  readonly generator: Generator<RuntimeInstruction, A, any>
  readonly next: MutableRef.MutableRef<any>
  readonly previous: GeneratorNode<any> | null
}

interface InstructionNode {
  readonly type: 'Instruction'
  readonly instruction: RuntimeInstruction
  readonly previous: GeneratorNode<any>
}

function handleSyncInstructions<R, A>(
  fx: Fx<R, A>,
  scope: Scope.LocalScope<R, A>,
  context: Context.Context,
): Generator<RuntimeInstruction, A> {
  return pipe(
    fx,
    handle(function* handleSync(instruction) {
      switch (instruction.type) {
        case 'FromValue':
          return instruction.input
        case 'FromIO':
          return instruction.input()
        case 'GetContext':
          return context
        case 'GetScope':
          return scope
        case 'Provide': {
          const [fx, requirements] = instruction.input

          return yield* handleSyncInstructions(fx, { ...scope, requirements }, context)
        }
        case 'Fork': {
          const forkOptions = instruction.input as ForkOptions<R, any>

          return makeRuntimeFiber(forkOptions.fx, {
            scope: Scope.fork(forkOptions.scope ?? scope),
            context: Context.fork(forkOptions.context ?? context, forkOptions.inheritRefs),
          })
        }
        case 'Join': {
          return yield* handleSyncInstructions(
            Fx(function* () {
              const exit = yield* instruction.input.exit

              if (isLeft(exit)) {
                return yield* fromCause(exit.left)
              }

              // Inherit references
              yield* instruction.input.context.locals.inherit

              return exit.right
            }),
            scope,
            context,
          )
        }
        case 'Drain': {
          const local = Scope.fork<R, void>(scope)

          // Keep the subscribing Scope open until stream closes
          MutableRef.incrementAndGet(scope.refCount)

          return pipe(
            instruction.input,
            drain({
              scope: local,
              context,
              disposable: {
                dispose: () => {
                  MutableRef.decrementAndGet(scope.refCount)
                },
              },
            }),
          )
        }

        default:
          return yield instruction
      }
    }),
  )[Symbol.iterator]()
}

function suspendedStatus(status: MutableRef.MutableRef<Status>) {
  status.set({ type: 'Suspended' })
}

function runningStatus(status: MutableRef.MutableRef<Status>) {
  status.set({ type: 'Running' })
}
