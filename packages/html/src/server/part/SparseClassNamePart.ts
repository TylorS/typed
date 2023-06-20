import * as Effect from '@effect/io/Effect'

import { ClassNamePart } from './ClassNamePart.js'

import { ClassNamePartNode, TextNode } from '@typed/html/parser/parser'

export class SparseClassNamePart {
  readonly _tag = 'SparseClassName' as const

  constructor(
    protected setClassName: (value: string) => Effect.Effect<never, never, void>,
    protected parts: readonly ClassNamePart[],
    protected value: string | null = null,
  ) {}

  protected getValue(value: unknown): string | null {
    if (value == null) return ''

    return String(value)
  }

  update(value: string): Effect.Effect<never, never, void> {
    return Effect.suspend(() => {
      if (value === this.value) return Effect.unit()

      return Effect.tap(this.setClassName(value), () => Effect.sync(() => (this.value = value)))
    })
  }

  static fromPartNodes(
    setAttribute: (value: string | null) => Effect.Effect<never, never, void>,
    nodes: Array<ClassNamePartNode | TextNode>,
  ): SparseClassNamePart {
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

        if (values.size === nodes.length) {
          yield* $(setAttribute(getValue()))
        }
      })
    }

    const parts: ClassNamePart[] = []

    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i]

      if (node.type === 'text') {
        values.set(i, node.value)
      } else {
        parts.push(new ClassNamePart((value) => setValue(value, i), i, []))
      }
    }

    return new SparseClassNamePart(setAttribute, parts)
  }
}
