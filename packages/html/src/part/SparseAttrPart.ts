import * as Effect from '@effect/io/Effect'
import * as Scope from '@effect/io/Scope'
import * as Fx from '@typed/fx'

import { Renderable } from '../Renderable.js'
import { AttrPartNode, TextNode } from '../parser/parser.js'

import { AttrPart } from './AttrPart.js'
import { StaticTextPart } from './StaticTextPart.js'
import { unwrapSparsePartRenderables } from './updates.js'

export class SparseAttrPart {
  readonly _tag = 'SparseAttr' as const

  constructor(
    protected setAttribute: (value: string | null) => Effect.Effect<never, never, void>,
    readonly parts: ReadonlyArray<AttrPart | StaticTextPart>,
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
    placeholder: readonly Renderable<R, E>[],
    sink: Fx.Sink<R2, E, unknown>,
  ): Effect.Effect<R | R2 | Scope.Scope, never, void> {
    return Effect.forkScoped(
      Fx.drain(
        Fx.switchMatchCauseEffect(
          unwrapSparsePartRenderables(placeholder, this),
          sink.error,
          (value) => Effect.flatMap(this.update(value), () => sink.event(this.value)),
        ),
      ),
    )
  }

  static fromPartNodes(
    setAttribute: (value: string | null) => Effect.Effect<never, never, void>,
    nodes: Array<AttrPartNode | TextNode>,
  ): SparseAttrPart {
    const values: Map<number, string | null> = new Map()

    function getValue() {
      return (part.value = Array.from({ length: nodes.length }, (_, i) => values.get(i) || '').join(
        '',
      ))
    }

    function setValue(value: string | null, index: number) {
      return Effect.suspend(() => {
        values.set(index, value)

        if (values.size === nodes.length) return setAttribute(getValue())

        return Effect.unit()
      })
    }

    const parts: Array<StaticTextPart | AttrPart> = []

    let partIndex = 0
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i]

      if (node.type === 'text') {
        values.set(i, node.value)
        parts.push(new StaticTextPart(node.value))
      } else {
        parts.push(
          new AttrPart(
            (value) => setValue(value, i),
            () => setValue(null, i),
            partIndex++,
            null,
          ),
        )
      }
    }

    const part = new SparseAttrPart(setAttribute, parts)

    return part
  }
}
