import { Cause } from './Cause'

export interface Renderer<E> {
  readonly renderError: (error: E) => Lines
  readonly renderUnknown: (error: unknown) => Lines
}

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

export function renderCauseToSequential<E>(cause: Cause<E>, renderer: Renderer<E>): Sequential {
  switch (cause.type) {
    case 'Disposed':
      return Sequential([Failure([`Disposed.`])])
    case 'Expected':
      return Sequential([
        Failure(['An expected error has occurred.', '', ...renderer.renderError(cause.error)]),
      ])
    case 'Unexpected':
      return Sequential([
        Failure(['An unexpected error has occurred.', '', ...renderer.renderUnknown(cause.error)]),
      ])
    case 'Then':
      return Sequential(linearSegments(cause, renderer))
    case 'Both':
      return Sequential([Parallel(parrallelSegments(cause, renderer))])
  }
}

export function linearSegments<E>(cause: Cause<E>, renderer: Renderer<E>): readonly Step[] {
  switch (cause.type) {
    case 'Then':
      return [...linearSegments(cause.left, renderer), ...linearSegments(cause.right, renderer)]
    default:
      return renderCauseToSequential(cause, renderer).all
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
      return [renderCauseToSequential(cause, renderer)]
  }
}

export function renderError(error: Error): Lines {
  return lines(error.stack !== undefined ? error.stack : String(error))
}

export function lines(s: string): Lines {
  return s.split('\n').map((s) => s.replace('\r', ''))
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function renderString(u: any): string {
  return u?.toString?.() ?? JSON.stringify(u, null, 2)
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
  const s = renderCauseToSequential(cause, renderer)

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
}

export function prettyPrint<E>(cause: Cause<E>, renderer: Renderer<E> = defaultRenderer): string {
  const lines = prettyLines(cause, renderer)

  return `\n${lines.join('\n')}`
}
