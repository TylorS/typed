import * as Effect from '@effect/io/Effect'
import * as Fiber from '@effect/io/Fiber'
import * as Scope from '@effect/io/Scope'
import * as Fx from '@typed/fx'

import { Renderable } from '../Renderable.js'
import { ClassNamePartNode, TextNode } from '../parser/parser.js'

import { ClassNamePart } from './ClassNamePart.js'
import { StaticTextPart } from './StaticTextPart.js'
import { unwrapSparsePartRenderables } from './updates.js'

export class SparseClassNamePart {
  readonly _tag = 'SparseClassName' as const

  // Can be used to track resources for a given Part.
  public fibers: Set<Fiber.Fiber<never, unknown>> = new Set()

  constructor(
    protected setClassName: (value: string) => Effect.Effect<never, never, void>,
    readonly parts: ReadonlyArray<StaticTextPart | ClassNamePart>,
    protected value: string | null = null,
  ) {}

  protected getValue(value: unknown): string | null {
    if (value == null) return ''
    if (Array.isArray(value)) return value.join(' ')

    return String(value)
  }

  update = (input: unknown): Effect.Effect<never, never, void> => {
    return Effect.suspend(() => {
      const value = this.getValue(input)
      if (value === this.value) return Effect.unit()

      return Effect.flatMap(this.setClassName(value || ''), () =>
        Effect.sync(() => (this.value = value)),
      )
    })
  }

  observe<R, E, R2>(
    placeholder: readonly Renderable<R, E>[],
    sink: Fx.Sink<R2, E, unknown>,
  ): Effect.Effect<R | R2 | Scope.Scope, never, void> {
    return Fx.drain(
      Fx.switchMatchCauseEffect(
        unwrapSparsePartRenderables(placeholder, this),
        sink.error,
        (value) => Effect.flatMap(this.update(value), sink.event),
      ),
    )
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
          .join(' ') || null
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

    const parts: Array<StaticTextPart | ClassNamePart> = []

    let partIndex = 0
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i]

      if (node.type === 'text') {
        values.set(i, node.value)
        parts.push(new StaticTextPart(node.value))
      } else {
        parts.push(new ClassNamePart((value) => setValue(value, i), partIndex++, []))
      }
    }

    const part = new SparseClassNamePart(setAttribute, parts)

    // Each part should share the same fibers
    parts.forEach((p) => (p.fibers = part.fibers))

    return part
  }
}
