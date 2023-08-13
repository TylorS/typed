import * as Effect from '@effect/io/Effect'
import * as Scope from '@effect/io/Scope'
import { Sink } from '@typed/fx'

import { Renderable } from '../Renderable.js'

import { BasePart } from './BasePart.js'
import { handlePart } from './updates.js'

export class ClassNamePart extends BasePart<readonly string[]> {
  readonly _tag = 'ClassName' as const

  constructor(
    protected setClassName: (value: readonly string[]) => Effect.Effect<never, never, void>,
    index: number,
    value: readonly string[],
  ) {
    super(index, value)
  }

  protected getValue(value: unknown): readonly string[] {
    if (isString(value)) {
      return value.split(' ').filter((x) => isString(x) && x.trim() !== '')
    }

    if (Array.isArray(value)) {
      return value.filter((x) => isString(x) && x.trim() !== '')
    }

    return []
  }

  protected setValue(value: readonly string[]) {
    return this.setClassName(value)
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
  ): Effect.Effect<R | R2 | Scope.Scope, never, void> {
    return Effect.matchCauseEffect(handlePart(this, placeholder), {
      onFailure: sink.error,
      onSuccess: (fx) => (fx ? Effect.forkScoped(fx.run(sink)) : sink.event(this.value?.join(' '))),
    })
  }

  static fromElement(element: Element, index: number) {
    let previous: readonly string[] = Array.from(element.classList)
    const setClassName = (classNames: readonly string[]) =>
      Effect.sync(() => {
        const { added, removed } = diffClassNames(previous, classNames)

        previous = classNames
        element.classList.remove(...removed)
        element.classList.add(...added)
      })

    return new ClassNamePart(setClassName, index, previous)
  }
}

function isString(value: unknown): value is string {
  return typeof value === 'string'
}

function diffClassNames(previous: readonly string[], updated: readonly string[]) {
  const added = new Set<string>()
  const removed = new Set<string>()

  for (let i = 0; i < updated.length; i++) {
    const className = updated[i]

    if (!previous.includes(className)) {
      added.add(className)
    }
  }

  for (let i = 0; i < previous.length; i++) {
    const className = previous[i]

    if (!updated.includes(className)) {
      removed.add(className)
    }
  }

  return { added, removed } as const
}
