import * as Effect from '@effect/io/Effect'
import * as Scope from '@effect/io/Scope'
import { Sink } from '@typed/fx'

import { Renderable } from '../Renderable.js'

import { BasePart } from './BasePart.js'
import { handlePart } from './updates.js'

type DomStringMap = Partial<Readonly<Record<string, string>>>

export class DataPart extends BasePart<DomStringMap | null> {
  readonly _tag = 'Data' as const

  constructor(
    readonly updateDataSet: (value: DomStringMap | null) => Effect.Effect<never, never, void>,
    index: number,
    value: DomStringMap | null = null,
  ) {
    super(index, value)
  }

  protected getValue(value: unknown): DomStringMap | null {
    if (typeof value !== 'object') return null
    if (Array.isArray(value)) return null

    return value as DomStringMap | null
  }

  protected setValue(value: { readonly [key: string]: string | undefined } | null) {
    return this.updateDataSet(value)
  }

  observe<R, E, R2>(
    placeholder: Renderable<R, E>,
    sink: Sink<R2, E, unknown>,
  ): Effect.Effect<R | R2 | Scope.Scope, never, void> {
    return Effect.matchCauseEffect(handlePart(this, placeholder), sink.error, (fx) =>
      fx ? Effect.forkScoped(fx.run(sink)) : sink.event(this.value),
    )
  }

  static fromHTMLElement(element: HTMLElement, index: number) {
    let keys = new Set(Object.keys(element.dataset))

    const updateDataSet = (dataset: DomStringMap | null) => {
      if (dataset === null) {
        for (const key of keys) {
          delete element.dataset[key]
        }
      } else {
        const newKeys = new Set(Object.keys(dataset))

        for (const key of newKeys) {
          element.dataset[key] = dataset[key] ?? ''
        }

        for (const key of keys) {
          if (!newKeys.has(key)) {
            delete element.dataset[key]
          }
        }

        keys = newKeys
      }
    }

    return new DataPart(
      (d) => Effect.sync(() => updateDataSet(d)),
      index,
      Object.fromEntries(Array.from(keys).map((key) => [key, element.dataset[key]])),
    )
  }
}
