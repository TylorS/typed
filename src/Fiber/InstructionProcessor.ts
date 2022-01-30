import { isLeft, match } from 'fp-ts/Either'
import { pipe } from 'fp-ts/function'
import { getOrElse, isSome, Option, some } from 'fp-ts/Option'
import { Required } from 'ts-toolbelt/out/Object/Required'

import { prettyPrint, prettyStringify } from '@/Cause'
import { Disposable, DisposableQueue, sync, withRemove } from '@/Disposable'
import { Effect, FromExit, fromIO, Provide } from '@/Effect'
import { Exit, success, unexpected } from '@/Exit'
import { FiberContext } from '@/FiberContext'
import { Fx } from '@/Fx'
import { extendScope, LocalScope } from '@/Scope'
import { SourceLocation, Trace, TraceElement } from '@/Trace'

import { Instruction } from './Instruction'
import { Processor, ProcessorInstruction, Processors } from './Processor'
import type { RuntimeOptions } from './Runtime'
import {
  ResumeAsync,
  ResumePromise,
  RuntimeInstruction,
  RuntimeIterable,
} from './RuntimeInstruction'

/**
 * InstructionProcessor is the main workhorse for interpreting Fx's instructions into a Generator
 * of RuntimeInstructions. It tracks when to yield to other Fibers
 */
export class InstructionProcessor<R, E, A> implements RuntimeIterable<E, Exit<E, A>> {
  readonly executionTraces: Array<TraceElement> = []
  protected disposables: DisposableQueue = new DisposableQueue()
  protected opCount = 0
  protected releasing = false

  constructor(
    readonly fx: Fx<R, E, A>,
    readonly resources: R,
    readonly fiberContext: FiberContext<E>,
    readonly scope: LocalScope<E, A>,
    readonly processors: Processors,
    readonly parentTrace: Option<Trace>,
    readonly shouldTrace: boolean,
    readonly maxOpCount: number = 2048,
  ) {}

  *[Symbol.iterator]() {
    try {
      const generator = this.fx[Symbol.iterator]()
      const value = yield* this.run(generator, generator.next())

      return yield* this.release(success(value))
    } catch (e) {
      return yield* this.release(unexpected(e))
    }
  }

  /**
   * Capture the current Trace
   */
  readonly captureStackTrace = () =>
    new Trace(this.fiberContext.fiberId, this.executionTraces.slice(), this.parentTrace)

  /**
   * Helper for keeping track of a Disposable that will remove itself once some effect has
   * completed.
   */
  readonly trackDisposable = (f: (remove: () => void) => Disposable): Disposable =>
    pipe(this.disposables, withRemove(f))

  /**
   * Extend this InstructionProcessor's Scope, provides a potentially different resources,
   * and allows configuing part of that stack that does (not) trace execution.
   */
  readonly extend = <R2, B>(
    fx: Fx<R2, E, B>,
    resources: R2,
    shouldTrace: boolean = this.shouldTrace,
  ) =>
    new InstructionProcessor(
      fx,
      resources,
      this.fiberContext,
      extendScope(this.scope),
      this.processors,
      this.shouldTrace ? some(this.captureStackTrace()) : this.parentTrace,
      shouldTrace,
      this.maxOpCount,
    )

  /**
   * Forks the InstructionProcessor with fully customizable runtime.
   */
  readonly fork = <B>(fx: Fx<R, E, B>, options: Required<RuntimeOptions<E>, 'fiberContext'>) => {
    const shouldTrace = options.shouldTrace ?? this.shouldTrace
    const maxOps = options.maxOps ?? this.maxOpCount
    const processors = options.processors ?? this.processors

    return new InstructionProcessor(
      fx,
      this.resources,
      options.fiberContext,
      extendScope(options.scope ?? this.scope),
      processors,
      shouldTrace ? some(this.captureStackTrace()) : this.parentTrace,
      shouldTrace,
      maxOps,
    )
  }

  /**
   * Appends traces
   */
  protected addTrace(instruction: Instruction<R, E>) {
    this.executionTraces.push(formatInstruction(instruction, this.fiberContext))
  }

  /**
   * Releases the current Scope
   */
  protected *release(exit: Exit<E, A>): RuntimeIterable<E, Exit<E, A>> {
    this.releasing = true

    const releaseGenerator = this.scope.close(exit)[Symbol.iterator]()
    const released = yield* this.run(releaseGenerator, releaseGenerator.next())

    // If we couldn't release the scope, wait for this scope to close.
    if (!released) {
      const exit = yield new ResumeAsync<Exit<E, A>>((cb) => {
        const option = this.scope.ensure((exit) => fromIO(() => cb(exit)))

        return sync(() => isSome(option) && this.scope.cancel(option.value))
      })

      this.releasing = false

      return exit as Exit<E, A>
    }

    this.releasing = false

    return pipe(
      this.scope.exit.get(),
      getOrElse(() => exit),
    )
  }

  /**
   * Run a Generator of Fx Instructions.
   */
  protected *run<A>(
    generator: Generator<Effect<R, E, any>, A>,
    result: IteratorResult<Effect<R, E, any>, A>,
  ): RuntimeIterable<E, A> {
    while (!result.done) {
      const instr = result.value as Instruction<R, E>

      const processor = this.processors[instr.type] as Processor<typeof instr['type'], R, E>

      if (this.shouldTrace) {
        this.addTrace(instr)
      }

      try {
        result = generator.next(
          yield* this.handleProcessorInstruction(processor(instr as any, this)),
        )
      } catch (e) {
        result = generator.throw(e)
      }

      // Suspend to other fibers running
      if (++this.opCount > this.maxOpCount) {
        this.opCount = 0 // Reset the count
        yield new ResumePromise(Promise.resolve) // Yield to other fibers cooperatively
      }
    }

    return result.value
  }

  /**
   * Interpret ProcessorInstruction instructions.
   */
  protected *handleProcessorInstruction<A>(
    processorInstruction: ProcessorInstruction<R, E, A>,
  ): Generator<RuntimeInstruction<E>, any> {
    switch (processorInstruction.type) {
      /**
       * Handle nested Fx
       */
      case 'Fx': {
        const nested = processorInstruction.fx[Symbol.iterator]()

        return yield* this.run(nested, nested.next())
      }
      /**
       * Get the Exit value of an Fx
       */
      case 'Result': {
        const exit = yield* processorInstruction.processor

        this.executionTraces.unshift(...processorInstruction.processor.executionTraces)

        return exit
      }
      /**
       * Runs a InstructionProcessor which has extended/forked our Scope.
       */
      case 'Scoped': {
        const exit = yield* processorInstruction.processor

        this.executionTraces.unshift(...processorInstruction.processor.executionTraces)

        if (isLeft(exit)) {
          yield { type: 'Exit', exit }

          break
        }

        return exit.right
      }
      /**
       * Runs an Fx which returns a new ProcessorInstruction
       */
      case 'Deferred': {
        const nested = processorInstruction.fx[Symbol.iterator]()
        const instruction = yield* this.run(nested, nested.next())

        return yield* this.handleProcessorInstruction(instruction)
      }
      /**
       * Yield all RuntimeInstructions
       */
      default:
        return (yield processorInstruction) as A
    }
  }
}

export function formatInstruction<R, E>(instruction: Instruction<R, E>, context: FiberContext<E>) {
  switch (instruction.type) {
    case 'FromExit':
      return new SourceLocation(addTrace(instruction.trace, formatFromExit(instruction, context)))
    case 'Provide':
      return new SourceLocation(addTrace(instruction.trace, formatProvide(instruction)))
    default:
      return new SourceLocation(addTrace(instruction.trace, instruction.type))
  }
}

function formatFromExit<E, A>({ input }: FromExit<E, A>, context: FiberContext<E>) {
  return pipe(
    input,
    match(
      (cause) => `Failure<${prettyPrint(cause, context.renderer).replace(/\n/g, '\n  ')}>`,
      (a) => `Success<${prettyStringify(a)}>`,
    ),
  )
}

export function formatProvide<R, E, A>({ input }: Provide<R, E, A>) {
  return `Provide => ${prettyStringify(input)}`
}

export function addTrace(trace: string | undefined, str: string): string {
  if (trace === undefined) {
    return str
  }

  return `${trace} :: ${str}`
}
