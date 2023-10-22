import type { AST } from "@effect/schema"
import * as Schema from "@effect/schema/Schema"
import { ComputedTypeId } from "@typed/fx/Computed"
import { FilteredTypeId } from "@typed/fx/Filtered"
import type { Fx, FxInput } from "@typed/fx/Fx"
import { from, map } from "@typed/fx/internal/core"
import { make, struct } from "@typed/fx/internal/core-ref-subject"
import { matchFxInput } from "@typed/fx/internal/matchers"
import type { RefSubject, RefSubjectSchema, SchemaToRefSubject } from "@typed/fx/RefSubject"
import { RefSubjectTypeId } from "@typed/fx/TypeId"
import { Option } from "effect"
import * as Effect from "effect/Effect"
import type * as Equivalence from "effect/Equivalence"
import type * as Scope from "effect/Scope"
import * as SchemaEquivalence from "./schema-equivalence"

const makeSchema = <O>(
  f: <R, E>(
    input: FxInput<R, E, O>,
    eq?: Equivalence.Equivalence<O>
  ) => Effect.Effect<R | Scope.Scope, never, RefSubject<never, E, any> | SchemaToRefSubject<E, O>>
): RefSubjectSchema<O> => f as any as RefSubjectSchema<O>

const memoizeThunk = <A>(f: () => A) => {
  let memoized: Option.Option<A> = Option.none()

  return () => {
    if (Option.isNone(memoized)) {
      memoized = Option.some(f()) as Option.Some<A>
    }

    return memoized.value
  }
}

const defaultSchema = <O>(defaultEq?: Equivalence.Equivalence<O>) =>
  makeSchema(<R, E>(input: FxInput<R, E, O>, eq?: Equivalence.Equivalence<O>) => make(input, eq || defaultEq))

const go = <O>(
  ast: AST.AST,
  defaultEq: Equivalence.Equivalence<O> = SchemaEquivalence.go(ast)()
): RefSubjectSchema<O> => {
  switch (ast._tag) {
    case "AnyKeyword":
    case "BigIntKeyword":
    case "BooleanKeyword":
    case "Literal":
    case "Enums":
    case "NeverKeyword":
    case "NumberKeyword":
    case "ObjectKeyword":
    case "StringKeyword":
    case "SymbolKeyword":
    case "TemplateLiteral":
    case "Tuple":
    case "UndefinedKeyword":
    case "UniqueSymbol":
    case "UnknownKeyword":
    case "VoidKeyword":
      return defaultSchema<O>(defaultEq)
    case "Lazy": {
      const get = memoizeThunk(() => go<O>(ast.f(), defaultEq))

      return makeSchema((input, eq) => get()(input, eq))
    }
    case "Refinement":
      return go(ast.from)
    case "Transform":
      return go(ast.to)
    case "Declaration":
      return go(ast.type)
    case "TypeLiteral": {
      if (ast.propertySignatures.length === 0) {
        return defaultSchema<O>(defaultEq)
      }

      const propertySignaturesTypes = ast.propertySignatures.map((propertySignature) =>
        [propertySignature.name, go<any>(propertySignature.type)] as const
      )

      const makeSubjects = <R, E>(inputs: Record<PropertyKey, FxInput<R, E, any>>) =>
        Effect.gen(function*(_) {
          const subjects: any = {}
          for (const [name, make] of propertySignaturesTypes) {
            subjects[name] = yield* _(make(inputs[name]))
          }

          return subjects
        })

      const makeFxInputs = <R, E>(input: Fx<R, E, O>) => {
        const types: Record<PropertyKey, FxInput<R, E, any>> = {}

        if (RefSubjectTypeId in input || ComputedTypeId in input || FilteredTypeId in input) {
          for (const [name] of propertySignaturesTypes) {
            types[name] = (input as RefSubject<R, E, O>).map((o) => o[name as keyof typeof o])
          }
        } else {
          for (const [name] of propertySignaturesTypes) {
            types[name] = map(input, (o) => o[name as keyof typeof o])
          }
        }

        return types
      }

      const makeEffectInputs = <R, E>(input: Effect.Effect<R, E, O>) => {
        const types: Record<PropertyKey, FxInput<R, E, any>> = {}

        for (const [name] of propertySignaturesTypes) {
          types[name] = Effect.map(input, (o) => o[name as keyof typeof o])
        }

        return types
      }

      return makeSchema((input, eq) =>
        matchFxInput(input, {
          RefSubject: (source) => {
            return Effect.map(makeSubjects(makeFxInputs(source)), (subjects) => {
              const ref = rebuild(subjects) as typeof source

              return Object.assign(subjects, {
                commit: Effect.matchCauseEffect(ref, source)
              })
            })
          }, // TODO: Expand
          Fx: (fx) => makeSubjects(makeFxInputs(fx)),
          Stream: (stream) => makeSubjects(makeFxInputs(from(stream))),
          Effect: (effect) => makeSubjects(makeEffectInputs(effect)),
          Cause: (cause) => makeSubjects(makeEffectInputs(Effect.failCause(cause))),
          // Shouldn't really happen, but just in case fallback to default Schema
          Iterable: () => defaultSchema<O>()(input, eq),
          Otherwise: () => defaultSchema<O>()(input, eq)
        })
      )
    }
    case "Union":
      throw new Error("Unimplemented")
  }
}

export function fromRefSubject<I, O>(source: Schema.Schema<I, O>): RefSubjectSchema<I> {
  return go<I>(Schema.from(source).ast, SchemaEquivalence.from(source)())
}

export function toRefSubject<I, O>(source: Schema.Schema<I, O>): RefSubjectSchema<O> {
  return go<O>(Schema.to(source).ast, SchemaEquivalence.to(source)())
}

const rebuild = (subjects: Record<PropertyKey, any>) => {
  const output: any = {}

  for (const key of Reflect.ownKeys(subjects)) {
    const value = subjects[key]

    if (RefSubjectTypeId in value) {
      output[key] = value
    } else {
      output[key] = rebuild(value)
    }
  }

  return struct(output)
}
