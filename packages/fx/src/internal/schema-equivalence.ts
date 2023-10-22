import * as AST from "@effect/schema/AST"
import * as S from "@effect/schema/Schema"
import * as Data from "effect/Data"
import * as Equal from "effect/Equal"
import * as Eq from "effect/Equivalence"
import * as O from "effect/Option"
import * as RA from "effect/ReadonlyArray"

const createHookId = (id: string) => Symbol(`@typed/fx/schema-compilers/${id}`)

const memoizeThunk = <A>(f: () => A): () => A => {
  let done = false
  let a: A
  return () => {
    if (done) {
      return a
    }
    a = f()
    done = true
    return a
  }
}

export const EquivalenceHookId = createHookId("EquivalenceHookId")

export const equivalence = <A>(
  eq: Eq.Equivalence<A>
): <I>(self: S.Schema<I, A>) => S.Schema<I, A> => S.annotations({ [EquivalenceHookId]: eq })

const getAnnotation = AST.getAnnotation<Eq.Equivalence<unknown>>(EquivalenceHookId)

interface Equivalence<To> {
  (): Eq.Equivalence<To>
}

export const to = <I, A>(schema: S.Schema<I, A>): Equivalence<A> => go(AST.to(schema.ast))

export const from = <I, A>(schema: S.Schema<I, A>): Equivalence<I> => go(AST.from(schema.ast))

export const go = (ast: AST.AST): Equivalence<any> => {
  const annotations = getAnnotation(ast)
  if (annotations._tag === "Some") {
    return () => annotations.value
  }

  switch (ast._tag) {
    case "NeverKeyword":
      return () => () => false
    case "UndefinedKeyword":
    case "UnknownKeyword":
    case "VoidKeyword":
    case "AnyKeyword":
    case "Literal":
    case "Enums":
      return Eq.strict

    case "ObjectKeyword": // FIXME: Should this be strict?
      return () => (a, b) => {
        const aData = Data.struct(a)
        const bData = Data.struct(b)
        return Equal.equals(aData, bData)
      }

    case "BigIntKeyword":
      return () => Eq.bigint
    case "NumberKeyword":
      return () => Eq.number
    case "StringKeyword":
      return () => Eq.string
    case "TemplateLiteral":
      return () => Eq.string
    case "BooleanKeyword":
      return () => Eq.boolean

    case "SymbolKeyword":
    case "UniqueSymbol":
      return () => Eq.symbol

    case "Tuple": {
      const elements = ast.elements.map((e) => go(e.type))

      if (O.isSome(ast.rest)) {
        const head = go(RA.headNonEmpty(ast.rest.value))
        const tail = RA.tailNonEmpty(ast.rest.value).map((e) => go(e))
        const requiredElementsCount = elements.length + tail.length

        return () => (self: [], that: []) => {
          if (
            self.length !== that.length ||
            self.length < requiredElementsCount
          ) {
            return false
          }

          for (let i = 0; i < self.length; i++) {
            if (i < elements.length) {
              if (!elements[i]()(self[i], that[i])) return false
            } else {
              const remainingElements = self.length - i
              const matchesHead = head()(self[i], that[i])
              const matches = remainingElements <= tail.length
                ? tail[tail.length - remainingElements]()(self[i], that[i])
                : matchesHead

              if (!matches) return false
            }
          }

          return true
        }
      } else {
        return () => Eq.tuple(...elements.map((e) => e()))
      }
    }
    case "Refinement":
      return go(ast.from)
    case "Transform":
      return go(ast.to)
    case "Declaration":
      return go(ast.type)
    case "Union": {
      const members = ast.types.map((ast) => go(ast))
      const guards = ast.types.map((ast) => S.is(S.make(ast)))
      const length = guards.length

      return () => (self, that) => {
        for (let i = 0; i < length; ++i) {
          const g = guards[i]

          if (g(self) && g(that)) {
            return members[i]()(self, that)
          }
        }

        return false
      }
    }
    case "Lazy": {
      const get = memoizeThunk(() => go(ast.f()))
      return () => get()()
    }
    case "TypeLiteral": {
      const propertySignaturesTypes = ast.propertySignatures.map((f) => go(f.type))
      const indexSignatures = ast.indexSignatures.map(
        (is) => [go(is.parameter), go(is.type)] as const
      )

      return () => {
        return <A extends Record<PropertyKey, any>>(self: A, that: A) => {
          const selfKeys = Object.keys(self)
          const thatKeys = Object.keys(that)
          const mergedKeys = Object.keys({ ...self, ...that })

          // have identical keys
          if (
            selfKeys.length !== thatKeys.length ||
            thatKeys.length !== mergedKeys.length
          ) {
            return false
          }

          for (let i = 0; i < propertySignaturesTypes.length; i++) {
            const ps = ast.propertySignatures[i]
            const name = ps.name
            const eq = propertySignaturesTypes[i]()

            if (
              name in self &&
              name in that &&
              !eq(self[name], that[name])
            ) {
              return false
            }
          }

          for (const selfKey in self) {
            for (const thatKey in that) {
              for (let i = 0; i < indexSignatures.length; i++) {
                const is = indexSignatures[i]
                const nameEq = is[0]()
                const valEq = is[1]()
                if (
                  nameEq(selfKey, thatKey) &&
                  !valEq(self[selfKey], that[thatKey])
                ) {
                  return false
                }
              }
            }
          }

          return true
        }
      }
    }
  }
}
