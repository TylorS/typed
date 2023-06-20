import * as Effect from '@effect/io/Effect'

import { AttrPart } from './AttrPart.js'

import { AttrPartNode, TextNode } from '@typed/html/parser/parser'

export class SparseAttrPart {
  readonly _tag = 'SparseAttr' as const

  constructor(
    protected setAttribute: (value: string | null) => Effect.Effect<never, never, void>,
    protected parts: readonly AttrPart[],
    protected value: string | null = null,
  ) {}

  protected getValue(value: unknown): string | null {
    if (value == null) return null

    return String(value)
  }

  update(value: string | null): Effect.Effect<never, never, void> {
    return Effect.suspend(() => {
      if (value === this.value) return Effect.unit()

      return Effect.tap(this.setAttribute(value), () => Effect.sync(() => (this.value = value)))
    })
  }

  static fromPartNodes(
    setAttribute: (value: string | null) => Effect.Effect<never, never, void>,
    nodes: Array<AttrPartNode | TextNode>,
  ): SparseAttrPart {
    const values: Map<number, string | null> = new Map()

    function getValue() {
      return (
        Array.from(values.values())
          .filter((x) => x !== null)
          .join('') || null
      )
    }

    function setValue(value: string | null, index: number) {
      return Effect.gen(function* ($) {
        values.set(index, value)

        if (values.size === nodes.length) yield* $(setAttribute(getValue()))
      })
    }

    const parts: AttrPart[] = []

    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i]

      if (node.type === 'text') {
        values.set(i, node.value)
      } else {
        parts.push(
          new AttrPart(
            (value) => setValue(value, i),
            () => setValue(null, i),
            i,
            null,
          ),
        )
      }
    }

    return new SparseAttrPart(setAttribute, parts)
  }
}
