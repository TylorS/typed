import * as Effect from '@effect/io/Effect'
import * as Fiber from '@effect/io/Fiber'
import * as Scope from '@effect/io/Scope'
import * as Fx from '@typed/fx'

import { Renderable } from '../Renderable.js'

import { AttrPart } from './AttrPart.js'
import { unwrapRenderable } from './updates.js'

import { AttrPartNode, TextNode } from '@typed/html/parser/parser'

export class SparseAttrPart {
  readonly _tag = 'SparseAttr' as const

  // Can be used to track resources for a given Part.
  public fibers: Set<Fiber.Fiber<never, unknown>> = new Set()

  constructor(
    protected setAttribute: (value: string | null) => Effect.Effect<never, never, void>,
    readonly parts: readonly AttrPart[],
    protected value: string | null = null,
  ) {}

  protected getValue(value: unknown): string | null {
    if (value == null) return null

    if (Array.isArray(value)) return value.join('')

    return String(value)
  }

  update = (input: unknown): Effect.Effect<never, never, string | null> => {
    return Effect.suspend(() => {
      const value = this.getValue(input)

      if (value === this.value) return Effect.succeed(value)

      return Effect.flatMap(this.setAttribute(value), () => Effect.sync(() => (this.value = value)))
    })
  }

  observe<R, E, R2>(
    placeholder: Renderable<R, E>,
    sink: Fx.Sink<R2, E, unknown>,
  ): Effect.Effect<R | R2 | Scope.Scope, never, void> {
    return Fx.drain(
      Fx.switchMatchCauseEffect(unwrapRenderable(placeholder), sink.error, this.update),
    )
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

    const part = new SparseAttrPart(setAttribute, parts)

    // Each part should share the same fibers
    parts.forEach((p) => (p.fibers = part.fibers))

    return part
  }
}
