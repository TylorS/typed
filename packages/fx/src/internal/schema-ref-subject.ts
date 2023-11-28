import type { AST } from "@effect/schema"
import * as SchemaEquivalence from "@effect/schema/Equivalence"
import * as Schema from "@effect/schema/Schema"
import { Option } from "effect"
import * as Effect from "effect/Effect"
import type * as Equivalence from "effect/Equivalence"
import type * as Scope from "effect/Scope"
import type { Fx, FxInput } from "../Fx"
import type { MakeRefSubject, RefSubject, ToRefSubject } from "../RefSubject"
import { ComputedTypeId, FilteredTypeId, RefSubjectTypeId } from "../TypeId"
import { make, struct } from "./core-ref-subject.js"
import { map } from "./core.js"
import { matchFxInput } from "./matchers.js"

const makeSchema = <O>(
  f: <R, E>(
    input: FxInput<R, E, O>,
    eq?: Equivalence.Equivalence<O>
  ) => Effect.Effect<R | Scope.Scope, never, RefSubject<never, E, any> | ToRefSubject<E, O>>
): MakeRefSubject<O> => f as any as MakeRefSubject<O>

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
  getDefaultEq: (ast: AST.AST) => Equivalence.Equivalence<O>
): MakeRefSubject<O> => {
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
    case "Union": // TODO: Union should probably be better somehow
      return defaultSchema<O>(getDefaultEq(ast))
    case "Lazy": {
      const get = memoizeThunk(() => go<O>(ast.f(), getDefaultEq))

      return makeSchema((input, eq) => get()(input, eq))
    }
    case "Refinement":
      return go(ast.from, getDefaultEq)
    case "Transform":
      return go(ast.to, getDefaultEq)
    case "Declaration":
      return go(ast.type, getDefaultEq)
    case "TypeLiteral": {
      if (ast.propertySignatures.length === 0) {
        return defaultSchema<O>(getDefaultEq(ast))
      }

      const propertySignaturesTypes = ast.propertySignatures.map((propertySignature) =>
        [propertySignature.name, go<any>(propertySignature.type, getDefaultEq)] as const
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
                persist: Effect.tap(Effect.matchCauseEffect(ref, source), () =>
                  "persist" in source ? (source as RefSubject.Derived<any, any, any, any>).persist : Effect.unit)
              })
            })
          }, // TODO: Expand
          Fx: (fx) =>
            makeSubjects(makeFxInputs(fx)),
          Effect: (effect) => makeSubjects(makeEffectInputs(effect)),
          Cause: (cause) => makeSubjects(makeEffectInputs(Effect.failCause(cause))),
          // Shouldn't really happen, but just in case fallback to default Schema
          Iterable: () => defaultSchema<O>()(input, eq),
          Otherwise: () => defaultSchema<O>()(input, eq)
        })
      )
    }
  }
}

export function fromRefSubject<I, O>(source: Schema.Schema<I, O>): MakeRefSubject<I> {
  return go<I>(Schema.from(source).ast, (ast) => SchemaEquivalence.from(Schema.make(ast)))
}

export function toRefSubject<I, O>(source: Schema.Schema<I, O>): MakeRefSubject<O> {
  return go<O>(Schema.to(source).ast, (ast) => SchemaEquivalence.to(Schema.make(ast)))
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
