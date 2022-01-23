import { isLeft, match } from 'fp-ts/Either'
import { pipe } from 'fp-ts/function'
import { getOrElse, isSome, Option, some } from 'fp-ts/Option'
import { Required } from 'ts-toolbelt/out/Object/Required'

import { prettyPrint, prettyStringify } from '@/Cause'
import { Context } from '@/Context'
import { Disposable, DisposableQueue, sync, withRemove } from '@/Disposable'
import { Effect, FromExit, fromIO, Provide } from '@/Effect'
import { Exit, success, unexpected } from '@/Exit'
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

export class InstructionProcessor<R, E, A> implements RuntimeIterable<E, Exit<E, A>> {
  readonly executionTraces: Array<TraceElement> = []
  protected disposables: DisposableQueue = new DisposableQueue()
  protected ops = 0

  constructor(
    readonly fx: Fx<R, E, A>,
    readonly resources: R,
    readonly context: Context<E>,
    readonly scope: LocalScope<E, A>,
    readonly processors: Processors,
    readonly parentTrace: Option<Trace>,
    readonly shouldTrace: boolean,
    readonly maxOps: number = 2048,
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

  readonly captureStackTrace = () =>
    new Trace(this.context.fiberId, this.executionTraces.slice(), this.parentTrace)

  readonly trackDisposable = (f: (remove: () => void) => Disposable): Disposable =>
    pipe(this.disposables, withRemove(f))

  readonly extend = <R2, B>(
    fx: Fx<R2, E, B>,
    resources: R2,
    shouldTrace: boolean = this.shouldTrace,
  ) =>
    new InstructionProcessor(
      fx,
      resources,
      this.context,
      extendScope(this.scope),
      this.processors,
      this.shouldTrace ? some(this.captureStackTrace()) : this.parentTrace,
      shouldTrace,
      this.maxOps,
    )

  readonly fork = <B>(fx: Fx<R, E, B>, options: Required<RuntimeOptions<E>, 'context'>) => {
    const shouldTrace = options.shouldTrace ?? this.shouldTrace
    const maxOps = options.maxOps ?? this.maxOps
    const processors = options.processors ?? this.processors

    return new InstructionProcessor(
      fx,
      this.resources,
      options.context,
      extendScope(options.scope ?? this.scope),
      processors,
      shouldTrace ? some(this.captureStackTrace()) : this.parentTrace,
      shouldTrace ?? true,
      maxOps,
    )
  }

  protected addTrace(instruction: Instruction<R, E>) {
    this.executionTraces.push(formatInstruction(instruction, this.context))
  }

  protected *release(exit: Exit<E, A>): RuntimeIterable<E, Exit<E, A>> {
    const releaseGenerator = this.scope.close(exit)[Symbol.iterator]()
    const released = yield* this.run(releaseGenerator, releaseGenerator.next())

    if (!released) {
      const exit = yield new ResumeAsync<Exit<E, A>>((cb) => {
        const option = this.scope.ensure((exit) => fromIO(() => cb(exit)))

        return sync(() => isSome(option) && this.scope.cancel(option.value))
      })

      return exit as Exit<E, A>
    }

    return pipe(
      this.scope.exit.get(),
      getOrElse(() => exit),
    )
  }

  protected *run<A>(
    generator: Generator<Effect<R, E, any>, A>,
    result: IteratorResult<Effect<R, E, any>, A>,
    returned = false,
  ): RuntimeIterable<E, A> {
    while (!result.done) {
      const instr = result.value as Instruction<R, E>

      const processor = this.processors[instr.type] as Processor<typeof instr['type'], R, E>

      if (this.shouldTrace) {
        this.addTrace(instr)
      }

      try {
        result = generator.next(yield* this.handleProcessorInstruction(processor(instr, this)))
      } catch (e) {
        result = generator.throw(e)
      }

      // Suspend to other fibers running
      if (++this.ops > this.maxOps) {
        this.ops = 0
        yield new ResumePromise(Promise.resolve)
      }
    }

    // Allow any finally clauses to run
    if (!returned) {
      yield* this.run(generator, generator.return(result.value), true)
    }

    return result.value
  }

  protected *handleProcessorInstruction<A>(
    processorInstruction: ProcessorInstruction<R, E, A>,
  ): Generator<RuntimeInstruction<E>, any> {
    switch (processorInstruction.type) {
      case 'Fx': {
        const nested = processorInstruction.fx[Symbol.iterator]()

        return yield* this.run(nested, nested.next())
      }
      case 'Result': {
        const exit = yield* processorInstruction.processor

        this.executionTraces.unshift(...processorInstruction.processor.executionTraces)

        return exit
      }
      case 'Scoped': {
        const exit = yield* processorInstruction.processor

        this.executionTraces.unshift(...processorInstruction.processor.executionTraces)

        if (isLeft(exit)) {
          yield { type: 'Exit', exit }

          break
        }

        return exit.right
      }
      case 'Deferred': {
        const nested = processorInstruction.fx[Symbol.iterator]()
        const instruction = yield* this.run(nested, nested.next())

        return yield* this.handleProcessorInstruction(instruction)
      }
      default:
        return (yield processorInstruction) as A
    }
  }
}

export function formatInstruction<R, E>(instruction: Instruction<R, E>, context: Context<E>) {
  switch (instruction.type) {
    case 'FromExit':
      return new SourceLocation(addTrace(instruction.trace, formatFromExit(instruction, context)))
    case 'Provide':
      return new SourceLocation(addTrace(instruction.trace, formatProvide(instruction)))
    default:
      return new SourceLocation(addTrace(instruction.trace, instruction.type))
  }
}

function formatFromExit<E, A>({ input }: FromExit<E, A>, context: Context<E>) {
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
