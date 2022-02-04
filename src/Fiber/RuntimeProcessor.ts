import { isLeft, left, match } from 'fp-ts/Either'
import { pipe } from 'fp-ts/function'
import { isNone, isSome, none, Option, some } from 'fp-ts/Option'

import { Traced } from '@/Cause'
import { async, Disposable, DisposableQueue, dispose, disposeAll, sync } from '@/Disposable'
import { disposed, Exit, then, unexpected } from '@/Exit'
import { FiberId } from '@/FiberId'
import { InterruptableStatus } from '@/Scope/InterruptableStatus'
import { Trace } from '@/Trace'

import { Status } from './Fiber'
import { RuntimeGenerator, RuntimeInstruction, RuntimeIterable } from './RuntimeInstruction'

/**
 * The RuntimeProcessor is where all of our asynchrony and per-instruction Disposables are kept.
 * RuntimeProcessor takes a RuntimeIterable (like InstructionProcessor) and handles all of the asynchrony
 * via RuntimeInstructions. It handles the pausing/playing of an Fx, tracking the status of the running Fx,
 * and notification of all observers upon exit.
 */
export class RuntimeProcessor<E, A> implements Disposable {
  protected node: RuntimeInstructionTree<E, A> | undefined = undefined
  protected observers: Set<(exit: Exit<E, A>) => void> = new Set()
  protected exited: Option<Exit<E, A>> = none
  protected queue: DisposableQueue = new DisposableQueue()
  protected currentStatus!: Status

  constructor(
    readonly iterable: RuntimeIterable<E, Exit<E, A>>,
    readonly fiberId: FiberId,
    readonly captureStackTrace: () => Trace,
    readonly shouldTrace: boolean,
    readonly interruptableStatus: InterruptableStatus,
  ) {
    this.node = {
      type: 'Initial',
      iterable,
    }

    this.suspendedStatus()

    this.queue.add(
      sync(() => {
        if (isNone(this.exited)) {
          this.node = {
            type: 'Exit',
            exit: disposed(fiberId),
          }

          this.processNow()
        }
      }),
    )
  }

  get status() {
    return this.currentStatus
  }

  dispose = async(async () => {
    const { interruptableStatus } = this

    if (!interruptableStatus.isInterruptable) {
      await interruptableStatus.waitToInterrupt()
    }

    await dispose(this.queue)
  }).dispose

  processNow() {
    while (this.node && isNone(this.exited)) {
      if (this.currentStatus.type === 'Suspended') {
        this.runningStatus()
      }

      this.processNode(this.node)
    }

    if (this.currentStatus.type === 'Running') {
      this.suspendedStatus()
    }
  }

  processLater() {
    if (this.node) {
      const node = this.node
      this.node = undefined

      Promise.resolve().then(() => {
        this.node = node
        this.processNow()
      })
    }
  }

  addObserver(observer: (exit: Exit<E, A>) => void): Disposable {
    const current = this.exited

    if (isSome(current)) {
      const d = new DisposableQueue()

      Promise.resolve().then(() => {
        if (!d.isDisposed()) {
          observer(current.value)
        }
      })

      return d
    }

    this.observers.add(observer)

    return sync(() => this.observers.delete(observer))
  }

  protected processNode(node: RuntimeInstructionTree<E, A>) {
    switch (node.type) {
      case 'Initial':
        return this.processInitial(node)
      case 'Generator':
        return this.processGenerator(node)
      case 'Instruction':
        return this.processInstruction(node)
      case 'Exit':
        return this.processExit(node)
    }
  }

  protected processInitial(node: InitialNode<E, A>) {
    this.node = {
      type: 'Generator',
      generator: node.iterable[Symbol.iterator](),
      previous: node,
    }
  }

  protected processGenerator(node: GeneratorNode<E, A>) {
    const result = node.generator.next(node.next)

    if (!result.done) {
      const instruction = result.value

      this.node = {
        type: 'Instruction',
        instruction,
        previous: node,
      }

      return
    }

    if (node.previous.type === 'Initial') {
      this.node = {
        type: 'Exit',
        exit: result.value,
      }

      return
    }

    node.previous.next = result.value
    this.node = node.previous
  }

  protected processInstruction(node: InstructionNode<E, A>) {
    const { instruction, previous } = node

    switch (instruction.type) {
      case 'Sync': {
        previous.next = instruction.value
        this.node = previous

        return
      }

      case 'Promise': {
        this.node = undefined
        const inner = new DisposableQueue()
        const disposable = this.queue.add(inner)

        instruction
          .promise()
          .then(async (a) => {
            try {
              previous.next = a

              this.node = previous

              await dispose(disposeAll([inner, disposable]))
            } catch (e) {
              this.node = {
                type: 'Exit',
                exit: unexpected(e),
              }
            }

            this.processNow()
          })
          .catch(async (error) => {
            try {
              this.node = {
                type: 'Exit',
                exit: unexpected(error),
              }

              await dispose(disposeAll([inner, disposable]))
            } catch (e) {
              this.node = {
                type: 'Exit',
                exit: then(unexpected(error), unexpected(e)),
              }
            }

            this.processNow()
          })

        break
      }

      case 'Async': {
        this.node = undefined
        const inner = new DisposableQueue()

        inner.add(this.queue.add(inner))
        inner.add(
          instruction.async(async (a) => {
            try {
              previous.next = a

              this.node = previous

              await dispose(inner)
            } catch (e) {
              this.node = {
                type: 'Exit',
                exit: unexpected(e),
              }
            }

            this.processNow()
          }),
        )

        break
      }

      case 'Exit': {
        this.node = instruction

        break
      }
    }
  }

  protected processExit(node: ExitNode<E, A>) {
    this.currentStatus = pipe(
      node.exit,
      match(
        (): Status => ({ type: 'Failed' }),
        (): Status => ({ type: 'Completed' }),
      ),
    )

    const exit =
      this.shouldTrace && isLeft(node.exit)
        ? left(Traced(this.captureStackTrace(), node.exit.left))
        : node.exit
    this.exited = some(exit)
    this.observers.forEach((o) => o(exit))
    this.observers.clear()
  }

  protected suspendedStatus() {
    const { interruptableStatus } = this

    this.currentStatus = {
      type: 'Suspended',
      get isInterruptible() {
        return interruptableStatus.isInterruptable
      },
    }
  }

  protected runningStatus() {
    const { interruptableStatus } = this

    this.currentStatus = {
      type: 'Running',
      get isInterruptible() {
        return interruptableStatus.isInterruptable
      },
    }
  }
}

export type RuntimeInstructionTree<E, A> =
  | InitialNode<E, A>
  | GeneratorNode<E, A>
  | InstructionNode<E, A>
  | ExitNode<E, A>

export type InitialNode<E, A> = {
  readonly type: 'Initial'
  readonly iterable: RuntimeIterable<E, Exit<E, A>>
}

export type GeneratorNode<E, A> = {
  readonly type: 'Generator'
  readonly generator: RuntimeGenerator<E, any>
  readonly previous: GeneratorNode<E, A> | InitialNode<E, A>
  next?: any
}

export type InstructionNode<E, A> = {
  readonly type: 'Instruction'
  readonly instruction: RuntimeInstruction<E>
  readonly previous: GeneratorNode<E, A>
}

export type ExitNode<E, A> = {
  readonly type: 'Exit'
  readonly exit: Exit<E, A>
}
