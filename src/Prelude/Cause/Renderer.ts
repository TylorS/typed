import { prettyFiberId } from '@/FiberId'
import { pipe } from '@/Prelude/function'
import * as O from '@/Prelude/Option'
import * as Sync from '@/Prelude/Sync'
import { prettyTrace, Trace } from '@/Trace'

import { Cause, Disposed, Expected, Unexpected } from './Cause'

export interface Renderer<E> {
  readonly renderError: (error: E) => Lines
  readonly renderUnknown: (error: unknown) => Lines
  readonly renderTrace: TraceRenderer
}

export type TraceRenderer = (trace: Trace) => string

/**
 * Each item in the array represents a newline
 */
export type Lines = readonly string[]

export type Segment = Sequential | Parallel | Failure

export type Step = Parallel | Failure

export interface Failure {
  readonly type: 'Failure'
  readonly lines: Lines
}

export interface Parallel {
  readonly type: 'Parallel'
  readonly all: readonly Sequential[]
}

export interface Sequential {
  readonly type: 'Sequential'
  readonly all: readonly Step[]
}

export function Failure(lines: readonly string[]): Failure {
  return {
    type: 'Failure',
    lines,
  }
}

export function Sequential(all: readonly Step[]): Sequential {
  return {
    type: 'Sequential',
    all,
  }
}

export function Parallel(all: readonly Sequential[]): Parallel {
  return {
    type: 'Parallel',
    all,
  }
}

export function renderDisposed<E>(
  cause: Disposed,
  trace: O.Option<Trace>,
  renderer: Renderer<E>,
): Sequential {
  return Sequential([
    Failure([
      `Disposed by Fiber ${prettyFiberId(cause.fiberId)}.`,
      '',
      ...renderTrace(trace, renderer),
    ]),
  ])
}

export function renderExpected<E>(
  cause: Expected<E>,
  trace: O.Option<Trace>,
  renderer: Renderer<E>,
) {
  return Sequential([
    Failure([
      'An expected error has occurred.',
      '',
      ...renderer.renderError(cause.error),
      ...renderTrace(trace, renderer),
    ]),
  ])
}

export function renderUnexpected<E>(
  cause: Unexpected,
  trace: O.Option<Trace>,
  renderer: Renderer<E>,
) {
  return Sequential([
    Failure([
      'An unexpected error has occurred.',
      '',
      ...renderer.renderUnknown(cause.error),
      ...renderTrace(trace, renderer),
    ]),
  ])
}

export function renderCauseToSequential<E>(
  cause: Cause<E>,
  renderer: Renderer<E>,
): Sync.Sync<Sequential> {
  return Sync.Sync(function* () {
    switch (cause.type) {
      case 'Expected':
        return renderExpected(cause, O.None, renderer)
      case 'Unexpected':
        return renderUnexpected(cause, O.None, renderer)
      case 'Disposed':
        return renderDisposed(cause, O.None, renderer)
      case 'Then':
        return Sequential(linearSegments(cause, renderer))
      case 'Both':
        return Sequential([Parallel(parrallelSegments(cause, renderer))])
      case 'Traced': {
        switch (cause.cause.type) {
          case 'Expected':
            return renderExpected(cause.cause, O.Some(cause.trace), renderer)
          case 'Unexpected':
            return renderUnexpected(cause.cause, O.Some(cause.trace), renderer)
          case 'Disposed':
            return renderDisposed(cause.cause, O.Some(cause.trace), renderer)
          default: {
            const { all }: Sequential = yield* renderCauseToSequential(cause.cause, renderer)
            const rendered = renderTrace(O.Some(cause.trace), renderer)

            return Sequential([
              ...(rendered.every((x) => Sync.run(includes(all, x)))
                ? []
                : [Failure(['An error was rethrown with a new trace.', ...rendered])]),
              ...all,
            ])
          }
        }
      }
    }
  })
}

function includes(steps: ReadonlyArray<Step>, value: string): Sync.Sync<boolean> {
  return Sync.Sync(function* () {
    // Reverse steps as this will usually be at the bottom of the previous section
    for (const step of steps.slice().reverse()) {
      if (yield* stepIncludes(step, value)) {
        return true
      }
    }

    return false
  })
}

function stepIncludes(step: Step, value: string): Sync.Sync<boolean> {
  return Sync.Sync(function* () {
    switch (step.type) {
      case 'Failure':
        return step.lines.includes(value)
      case 'Parallel':
        return yield* includes(
          step.all.flatMap((s) => s.all),
          value,
        )
    }
  })
}

export function linearSegments<E>(cause: Cause<E>, renderer: Renderer<E>): readonly Step[] {
  switch (cause.type) {
    case 'Then':
      return [...linearSegments(cause.left, renderer), ...linearSegments(cause.right, renderer)]
    default:
      return Sync.run(renderCauseToSequential(cause, renderer)).all
  }
}

export function parrallelSegments<E>(
  cause: Cause<E>,
  renderer: Renderer<E>,
): readonly Sequential[] {
  switch (cause.type) {
    case 'Both':
      return [
        ...parrallelSegments(cause.left, renderer),
        ...parrallelSegments(cause.right, renderer),
      ]
    default:
      return [Sync.run(renderCauseToSequential(cause, renderer))]
  }
}

export function renderError(error: Error): Lines {
  return lines(error.stack !== undefined ? error.stack : String(error))
}

export function renderTrace<E>(trace: O.Option<Trace>, renderer: Renderer<E>): Lines {
  return pipe(
    trace,
    O.match(
      () => [],
      (trace) => lines(renderer.renderTrace(trace)),
    ),
  )
}

export function lines(s: string): Lines {
  return s.split('\n').map((s) => s.replace('\r', ''))
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function renderString(u: any): string {
  const s = u?.toString?.()
  const shouldJsonify = !s || s.trim().startsWith('[object')

  return shouldJsonify ? JSON.stringify(u, null, 2) : s
}

export function prefixBlock(lines: Lines, headPrefix: string, tailPrefix: string): Lines {
  if (lines.length === 0) {
    return []
  }

  const [head, ...tail] = lines

  return [`${headPrefix}${head}`, ...tail.map((t) => `${tailPrefix}${t}`)]
}

export function format(segment: Segment): Lines {
  switch (segment.type) {
    case 'Failure': {
      return prefixBlock(segment.lines, '─', ' ')
    }
    case 'Parallel': {
      return [
        '══╦'.repeat(segment.all.length - 1) + '══╗',
        ...segment.all.reduceRight(
          (acc: Lines, current: Sequential): Lines => [
            ...prefixBlock(acc, '  ║', '  ║'),
            ...prefixBlock(format(current), '  ', '  '),
          ],
          [],
        ),
      ]
    }
    case 'Sequential': {
      return segment.all.flatMap((seg) => ['║', ...prefixBlock(format(seg), '╠', '║'), '▼'])
    }
  }
}

export function prettyLines<E>(cause: Cause<E>, renderer: Renderer<E>): Lines {
  const s = Sync.run(renderCauseToSequential(cause, renderer))

  if (s.all.length === 1 && s.all[0].type === 'Failure') {
    return s.all[0].lines
  }

  const formatted = format(s)

  return formatted.length === 0 ? [] : ['╥', ...formatted.slice(1)]
}

export function defaultErrorToLines(error: unknown): Lines {
  return error instanceof Error ? renderError(error) : lines(renderString(error))
}

export const defaultRenderer: Renderer<unknown> = {
  renderError: defaultErrorToLines,
  renderUnknown: defaultErrorToLines,
  renderTrace: prettyTrace,
}

export function prettyPrint<E>(cause: Cause<E>, renderer: Renderer<E> = defaultRenderer): string {
  const lines = prettyLines(cause, renderer)

  return `\n${lines.join('\n')}`.trimRight()
}
