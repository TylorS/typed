import { isLeft } from 'fp-ts/Either'
import { isSome, Option, some } from 'fp-ts/Option'

import { isDisposed } from '@/Cause'
import { Context } from '@/Context'
import * as D from '@/Disposable'
import { fromIO } from '@/Effect/FromIO'
import { disposed, Exit, success } from '@/Exit'
import { Fx } from '@/Fx'
import { LocalScope } from '@/Scope'
import { SourceLocation, Trace, TraceElement } from '@/Trace'

import { Instruction } from './Instruction'
import {
  ExitNode,
  GeneratorNode,
  InitialNode,
  InstructionNode,
  InstructionTree,
} from './InstructionTree'
import { Processor, Resume, ResumeAsync, ResumeDeferred } from './Processor'

export type Processors = {
  readonly [K in Instruction<any, any>['type']]: Processor<any, any, K>
}

// TODO: Report the current status of running
export class InstructionProcessor<R, E, A> implements D.Disposable {
  private node: InstructionTree<R, E, any> | undefined
  private observers: Set<(exit: Exit<E, A>) => void> = new Set()
  private disposables: D.DisposableQueue = new D.DisposableQueue()
  private exited = false
  private executionTraces: Array<TraceElement> = []
  private stackTraces: Array<TraceElement> = []

  constructor(
    readonly fx: Fx<R, E, A>,
    readonly resources: R,
    readonly context: Context<E>,
    readonly scope: LocalScope<E, A>,
    readonly processors: Processors,
    readonly parentTrace: Option<Trace>,
    readonly shouldTrace: boolean = true,
    readonly maxOps: number = 2048,
  ) {
    this.node = {
      type: 'Initial',
      fx,
    }

    this.disposables.add(
      D.async(
        () =>
          new Promise<Exit<E, A>>((resolve) => {
            if (!this.scope.open) {
              return
            }

            this.addObserver(resolve)
            this.node = { type: 'Exit', exit: disposed(this.context.fiberId) }
            this.processNow()
          }),
      ),
    )
  }

  processNow() {
    let ops = 0
    while (this.node && !this.scope.released && !this.exited) {
      if (ops++ < this.maxOps) {
        this.processNode(this.node)
      } else {
        this.processLater()
        break
      }
    }
  }

  processLater() {
    void Promise.resolve().then(() => {
      this.processNow()
    })
  }

  addObserver(observer: (exit: Exit<E, A>) => void): D.Disposable {
    this.observers.add(observer)

    return D.sync(() => this.observers.delete(observer))
  }

  captureTrace = () =>
    new Trace(this.context.fiberId, this.executionTraces, this.stackTraces, this.parentTrace)

  get dispose() {
    return this.disposables.dispose
  }

  private processNode(node: InstructionTree<R, E, any>) {
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

  private processInitial(node: InitialNode<R, E>) {
    this.node = {
      type: 'Generator',
      generator: iterator(node.fx),
      previous: node,
      method: 'next',
    }
  }

  private processGenerator(node: GeneratorNode<R, E>) {
    const result = node.generator[node.method](node.next)

    if (!result.done) {
      // Reset the generator method to next
      node.method = 'next'

      this.node = {
        type: 'Instruction',
        instruction: result.value as Instruction<R, E>,
        previous: node,
      }

      return
    }

    // Allow any finally clauses to run any additional effects
    if (node.method !== 'return') {
      node.method = 'return'
      node.next = result.value

      return
    }

    // Continue running the generator
    if (node.previous.type === 'Generator') {
      node.previous.next = result.value

      this.node = node.previous

      return
    }

    // Begin the exit process
    if (node.previous.type === 'Initial') {
      this.node = {
        type: 'Exit',
        exit: success(result.value),
      }

      return
    }

    // Notify observers of completion
    const exitCode = this.scope.exit.get()
    if (this.scope.released && isSome(exitCode)) {
      this.done(exitCode.value)
    }
  }

  private processInstruction(node: InstructionNode<R, E>) {
    const { instruction, previous } = node

    const processor = this.processors[instruction.type] as Processor<
      R,
      E,
      typeof instruction['type']
    >

    if (this.shouldTrace && instruction.trace) {
      this.addExecutionTrace(instruction.trace)
    }

    try {
      const resume = processor(
        instruction,
        previous,
        this,
        (instruction, resources, context, scope, onExit) => {
          const runtime = new InstructionProcessor(
            instruction,
            resources,
            context,
            scope,
            this.processors,
            this.shouldTrace ? some(this.captureTrace()) : this.parentTrace,
            this.shouldTrace,
            this.maxOps,
          )

          runtime.addObserver(onExit)
          runtime.processNow()

          return runtime
        },
      )

      this.processResume(resume, previous)
    } catch (e) {
      previous.next = e
      previous.method = 'throw'

      this.node = previous
    }
  }

  private processResume(resume: Resume<R, E, any>, previous: GeneratorNode<R, E>) {
    const shouldContinue = this.node === undefined

    switch (resume.type) {
      case 'Sync': {
        previous.next = resume.value
        this.node = previous

        break
      }
      case 'Async': {
        return this.processResumeAsync(resume, previous)
      }
      case 'Node': {
        this.node = resume.node
        break
      }
      case 'Deferred':
        return this.processResumeDeferred(resume, previous)
    }

    if (shouldContinue) {
      this.processNow()
    }
  }

  private processResumeAsync(resume: ResumeAsync<any>, previous: GeneratorNode<R, E>) {
    // Break the current while-loop
    this.node = undefined

    const inner = new D.DisposableQueue()
    const disposable = this.disposables.add(inner)

    inner.add(
      resume.run(async (value) => {
        try {
          // Cleanup after ourselves
          await D.dispose(disposable)
          previous.next = value
          this.node = previous
          this.processNow()
        } catch (e) {
          previous.next = e
          previous.method = 'throw'
          this.node = previous
          this.processNow()
        }
      }),
    )
  }

  private processResumeDeferred(resume: ResumeDeferred<R, E, any>, previous: GeneratorNode<R, E>) {
    // Break the current while-loop
    this.node = undefined

    const inner = new D.DisposableQueue()
    const disposable = this.disposables.add(inner)

    inner.add(
      resume.defer(async (resume) => {
        try {
          // Cleanup after ourselves
          await D.dispose(disposable)

          this.processResume(resume, previous)
        } catch (e) {
          previous.next = e
          previous.method = 'throw'
          this.node = previous
          this.processNow()
        }
      }),
    )
  }

  // TODO: Handle Status
  private processExit(node: ExitNode<E, A>) {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const that = this

    if (isLeft(node.exit) && isDisposed(node.exit)) {
      // TODO: Track interrupting
    }

    this.node = {
      type: 'Generator',
      generator: (function* () {
        const released = yield* that.scope.close(node.exit)

        that.exited = true

        if (!released) {
          that.scope.ensure((exit) => fromIO(() => that.done(exit)))
        }
      })(),
      method: 'next',
      previous: node,
    }
  }

  // TODO: Handle Status
  private done(exit: Exit<E, A>) {
    if (isLeft(exit) && this.observers.size === 0) {
      this.context.reportFailure(exit.left)
    } else {
      this.observers.forEach((f) => f(exit))
      this.observers.clear()
    }

    this.node = undefined
  }

  private addExecutionTrace(trace: string) {
    this.executionTraces.unshift(new SourceLocation(trace))
  }
}

function iterator<Y, R, N>(fx: { readonly [Symbol.iterator]: () => Generator<Y, R, N> }) {
  return fx[Symbol.iterator]()
}
