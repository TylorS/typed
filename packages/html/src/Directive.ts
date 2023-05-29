import * as Effect from '@effect/io/Effect'

import { Placeholder } from './Placeholder.js'
import { AttrPart } from './part/AttrPart.js'
import { BooleanPart } from './part/BooleanPart.js'
import { ClassNamePart } from './part/ClassNamePart.js'
import { DataPart } from './part/DataPart.js'
import { Part } from './part/Part.js'

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
): Directive<R, E> {
  return directive((part) => {
    if (tags.includes(part._tag)) {
      return f(part as Extract<Part, { readonly _tag: A[number] }>)
    }

    return Effect.unit()
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

// TODO: More directives
