import * as Effect from '@effect/io/Effect'
import { Sink } from '@typed/fx'

import { Renderable } from '../Renderable.js'

import { BasePart } from './BasePart.js'
import { handlePart } from './updates.js'

export class ClassNamePart extends BasePart<readonly string[]> {
  readonly _tag = 'ClassName' as const

  constructor(
    protected setClassName: (value: string) => Effect.Effect<never, never, void>,
    index: number,
    value: readonly string[],
  ) {
    super(index, value)
  }

  protected getValue(value: unknown): readonly string[] {
    if (isString(value)) {
      return value.split(' ')
    }

    if (Array.isArray(value)) {
      return value.filter(isString)
    }

    return []
  }

  protected setValue(value: readonly string[]) {
    return this.setClassName(value.join(' '))
  }

  add(...classNames: readonly string[]) {
    return this.update(this.value ? [...this.value, ...classNames] : classNames)
  }

  remove(...classNames: readonly string[]) {
    return this.update(this.value ? this.value.filter((c) => !classNames.includes(c)) : [])
  }

  toggle(...classNames: readonly string[]) {
    return Effect.suspend(() => {
      const updated = new Set(this.value)

      for (let i = 0; i < classNames.length; i++) {
        const className = classNames[i]

        if (updated.has(className)) {
          updated.delete(className)
        } else {
          updated.add(className)
        }
      }

      return this.update(Array.from(updated))
    })
  }

  observe<R, E, R2>(
    placeholder: Renderable<R, E>,
    sink: Sink<R2, E, unknown>,
  ): Effect.Effect<R | R2, never, void> {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const part = this

    return Effect.catchAllCause(
      Effect.gen(function* (_) {
        const fx = yield* _(handlePart(part, placeholder))

        if (fx) {
          yield* _(fx.run(sink))
        } else {
          yield* _(sink.event(part.value?.join(' ') ?? ''))
        }
      }),
      sink.error,
    )
  }

  static fromElement(element: Element, index: number) {
    const setClassName = (value: string) => Effect.sync(() => (element.className = value))

    return new ClassNamePart(setClassName, index, Array.from(element.classList))
  }
}

function isString(value: unknown): value is string {
  return typeof value === 'string'
}
