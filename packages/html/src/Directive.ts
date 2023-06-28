import * as Effect from '@effect/io/Effect'

import { Placeholder } from './Placeholder.js'
import type { AttrPart } from './part/AttrPart.js'
import type { BooleanPart } from './part/BooleanPart.js'
import type { ClassNamePart } from './part/ClassNamePart.js'
import type { DataPart } from './part/DataPart.js'
import type { EventPart } from './part/EventPart.js'
import type { NodePart } from './part/NodePart.js'
import type { Part } from './part/Part.js'
import type { PropertyPart } from './part/PropertyPart.js'
import type { RefPart } from './part/RefPart.js'
import type { TextPart } from './part/TextPart.js'

export class Directive<R, E> implements Placeholder<R, E, void> {
  readonly __Placeholder__!: {
    readonly _R: (_: never) => R
    readonly _E: (_: never) => E
    readonly _A: (_: never) => void
  }

  constructor(readonly f: (part: Part) => Effect.Effect<R, E, void>) {}
}

export function directive<R, E>(f: (part: Part) => Effect.Effect<R, E, void>): Directive<R, E> {
  return new Directive(f)
}

export function isDirective<R, E>(value: unknown): value is Directive<R, E> {
  return value instanceof Directive
}

export function directiveFor<const A extends ReadonlyArray<Part['_tag']>, R, E>(
  tags: A,
  f: (part: Extract<Part, { readonly _tag: A[number] }>) => Effect.Effect<R, E, void>,
  name?: string,
): Directive<R, E> {
  return directive((part) => {
    if (tags.includes(part._tag)) {
      return f(part as Extract<Part, { readonly _tag: A[number] }>)
    }

    const msg = name
      ? `Directive ${part._tag} is not supproted by ${name} directive.`
      : `Directive ${part._tag} is not within the support list ${tags.join(', ')}.`

    return Effect.logDebug(msg)
  })
}

export function attrDirective<R, E>(f: (part: AttrPart) => Effect.Effect<R, E, void>) {
  return directiveFor(['Attr'], f)
}

export function booleanDirective<R, E>(f: (part: BooleanPart) => Effect.Effect<R, E, void>) {
  return directiveFor(['Boolean'], f)
}

export function classNameDirective<R, E>(f: (part: ClassNamePart) => Effect.Effect<R, E, void>) {
  return directiveFor(['ClassName'], f)
}

export function dataDirective<R, E>(f: (part: DataPart) => Effect.Effect<R, E, void>) {
  return directiveFor(['Data'], f)
}

export function eventDirective<R, E>(f: (part: EventPart) => Effect.Effect<R, E, void>) {
  return directiveFor(['Event'], f)
}

export function nodeDirective<R, E>(f: (part: NodePart) => Effect.Effect<R, E, void>) {
  return directiveFor(['Node'], f)
}

export function propertyDirective<R, E>(f: (part: PropertyPart) => Effect.Effect<R, E, void>) {
  return directiveFor(['Property'], f)
}

export function refDirective<R, E>(f: (part: RefPart) => Effect.Effect<R, E, void>) {
  return directiveFor(['Ref'], f)
}

export function textDirective<R, E>(f: (part: TextPart) => Effect.Effect<R, E, void>) {
  return directiveFor(['Text'], f)
}
