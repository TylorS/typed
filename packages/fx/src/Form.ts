/**
 * @since 1.18.0
 */
import { AST } from "@effect/schema"
import type { ParseOptions } from "@effect/schema/AST"
import { from } from "@effect/schema/Equivalence"
import type { ParseError } from "@effect/schema/ParseResult"
import * as S from "@effect/schema/Schema"
import type { Scope } from "effect"
import { Effect } from "effect"
import { Computed } from "./Computed.js"
import type * as Filtered from "./Filtered.js"
import * as FormEntry from "./FormEntry.js"
import type { Fx } from "./Fx.js"
import * as core from "./internal/core.js"
import { FxEffectBase } from "./internal/protos.js"
import { hold } from "./internal/share.js"
import type { RefSubject } from "./RefSubject.js"
import { ComputedTypeId, FilteredTypeId, RefSubjectTypeId, TypeId } from "./TypeId.js"
import type * as Versioned from "./Versioned.js"

/**
 * @since 1.18.0
 */
export const FormTypeId = Symbol.for("./Form.js")
/**
 * @since 1.18.0
 */
export type FormTypeId = typeof FormTypeId

type AnyObject = Readonly<Record<PropertyKey, any>>
type AnyObjectWithKeys<K extends PropertyKey> = Readonly<Record<K, any>>

/**
 * @since 1.18.0
 */
export interface Form<Entries extends Form.AnyEntries> extends
  Form.Base<
    Form.Error<Entries[keyof Entries]>,
    Form.Input<Entries>,
    Form.Output<Entries>,
    Entries
  >
{}

/**
 * @since 1.18.0
 */
export namespace Form {
  /**
   * Base interface is to improve type-checking performance by memoizing the derived R, E, I, and O values.
   */
  /**
   * @since 1.18.0
   */
  export interface Base<E, I, O, Entries extends Form.AnyEntries>
    extends Versioned.Versioned<never, never, never, E | ParseError, I, never, E | ParseError, I>
  {
    readonly [FormTypeId]: FormTypeId

    readonly entries: Entries

    readonly schema: S.Schema<
      I,
      O
    >

    readonly get: <K extends keyof Entries>(key: K) => Entries[K]

    readonly decoded: Computed<
      never,
      E | ParseError,
      O
    >
  }

  /**
   * @since 1.18.0
   */
  export type AnyEntry =
    | FormEntry.FormEntry<any, any, any>
    | FormEntry.FormEntry<never, any, any>
    | FormEntry.FormEntry<any, never, any>
    | FormEntry.FormEntry<never, never, any>
    | Base<any, any, any, any>

  /**
   * @since 1.18.0
   */
  export type AnyEntries = Readonly<Record<PropertyKey, AnyEntry>>

  /**
   * @since 1.18.0
   */
  export type Error<T> = [T] extends [FormEntry.FormEntry<infer E, infer _I, infer _>] ? E :
    [T] extends [Base<infer _E, infer _I, infer _O, infer _Entries>] ? _E :
    never

  /**
   * @since 1.18.0
   */
  export type Input<T> = [T] extends [FormEntry.FormEntry<infer _E, infer I, infer _>] ? I :
    T extends Form<infer Entries> ? {
        readonly [K in keyof Entries]: Input<Entries[K]>
      } :
    T extends AnyEntries ? {
        readonly [K in keyof T]: Input<T[K]>
      } :
    never

  /**
   * @since 1.18.0
   */
  export type Output<T> = [T] extends [FormEntry.FormEntry<infer _E, infer _I, infer O>] ? O :
    T extends Form<infer Entries> ? {
        readonly [K in keyof Entries]: Output<Entries[K]>
      } :
    T extends AnyEntries ? {
        readonly [K in keyof T]: Output<T[K]>
      } :
    never

  /**
   * @since 1.18.0
   */
  export interface Derived<R, Entries extends AnyEntries> extends Form<Entries> {
    readonly persist: Effect.Effect<
      R,
      Error<Entries>,
      Output<Entries>
    >
  }
}

/**
 * @since 1.18.0
 */
export function Form<Entries extends Form.AnyEntries>(entries: Entries): Form<Entries> {
  return new FormImpl(entries) as any
}

/**
 * @since 1.18.0
 */
export type MakeForm<
  I extends AnyObject,
  O extends AnyObjectWithKeys<keyof I>
> = {
  <R, E>(fx: RefSubject<R, E, O>): Effect.Effect<
    R | Scope.Scope,
    never,
    [DerivedFromIO<R, E, I, O>] extends [Form.Derived<infer R, infer R2>] ? Form.Derived<R, R2> : never
  >

  <R, E>(fx: Fx<R, E, O>): Effect.Effect<
    R | Scope.Scope,
    never,
    [FormFromIO<E, I, O>] extends [Form<infer R>] ? Form<R> : never
  >

  <R, E>(effect: Effect.Effect<R, E, O>): Effect.Effect<
    R,
    never,
    [FormFromIO<E, I, O>] extends [Form<infer R>] ? Form<R> : never
  >
}

/**
 * @since 1.18.0
 */
export type FormFromIO<
  E,
  I extends AnyObject,
  O extends AnyObjectWithKeys<keyof I>
> = Form<
  [FormEntriesFromIO<E, I, O>] extends [infer R] ? { readonly [K in keyof R]: R[K] } : never
>

/**
 * @since 1.18.0
 */
export type FormEntriesFromIO<
  E,
  I extends AnyObject,
  O extends AnyObjectWithKeys<keyof I>
> = {
  readonly [K in keyof I]-?: [I[K], O[K]] extends [AnyObject, AnyObjectWithKeys<keyof I[K]>] ? Form<
      [FormEntriesFromIO<E, I[K], O[K]>] extends [infer R] ? { readonly [K in keyof R]: R[K] } : never
    > :
    FormEntry.FormEntry<E, I[K], O[K]>
}

/**
 * @since 1.18.0
 */
export type DerivedFromIO<
  R,
  E,
  I extends Readonly<Record<PropertyKey, any>>,
  O extends Readonly<Record<keyof I, any>>
> = Form.Derived<
  R,
  {
    readonly [K in keyof I]-?: FormEntry.FormEntry<E, I[K], O[K]>
  }
>

/**
 * @since 1.18.0
 */
export function make<
  I extends Partial<Readonly<Record<PropertyKey, any>>>,
  O extends Partial<AnyObjectWithKeys<keyof I>>
>(schema: S.Schema<I, O>): MakeForm<I, O> {
  return (input) =>
    Effect.map(deriveMakeEntries(input, schema.ast), (entries) => {
      const form = (Form as any)(entries)

      if (RefSubjectTypeId in input) {
        return Object.assign(form, {
          persist: Effect.matchCauseEffect(form.decoded, input)
        })
      }

      return form
    })
}

const parseOptions: ParseOptions = { errors: "all", onExcessProperty: "ignore" }

// @ts-expect-error
class FormImpl<Entries extends Form.AnyEntries> extends FxEffectBase<
  never,
  never,
  Form.Error<Entries> | ParseError,
  Form.Input<Entries>,
  never,
  Form.Error<Entries> | ParseError,
  Form.Input<Entries>
> implements Form<Entries> {
  readonly [FormTypeId]: FormTypeId = FormTypeId

  constructor(readonly entries: Entries) {
    super()

    this.schema = buildSchema(entries)
    this.version = Effect.map(
      // @ts-ignore Infinite type instantiation
      Effect.all(Object.values(entries).map((e) => e.version)) as Effect.Effect<
        never,
        never,
        ReadonlyArray<number>
      >,
      (versions) => versions.reduce((a, b) => a + b, 0)
    )
  }

  get: Form<Entries>["get"] = (k) => this.entries[k]

  schema: Form<Entries>["schema"]

  version: Form<Entries>["version"]

  toFx(): Fx<
    never,
    Form.Error<Entries> | ParseError,
    Form.Input<Entries>
  > {
    return hold(core.skipRepeatsWith(core.struct(this.entries as any) as any, from(this.schema))) as any
  }

  toEffect(): Effect.Effect<
    never,
    Form.Error<Entries> | ParseError,
    Form.Input<Entries>
  > {
    return (
      Effect.all(this.entries as any, { concurrency: "unbounded" }) as any
    )
  }

  decoded: Form<Entries>["decoded"] = Computed(
    this as any as Form<Entries>,
    (i) => S.decode(this.schema)(i, parseOptions)
  )
}

function buildSchema<Entries extends Form.AnyEntries>(
  entries: Entries
): S.Schema<Form.Input<Entries>, Form.Output<Entries>> {
  const schemas: any = {}

  for (const key of Reflect.ownKeys(entries)) {
    const entry = entries[key]

    if (FormTypeId in entry) {
      schemas[key] = buildSchema(entry.entries)
    } else {
      schemas[key] = entry.schema
    }
  }

  return S.struct(schemas) as any
}

type DeriveEntries<E, I extends Readonly<Record<PropertyKey, any>>, O extends Readonly<Record<keyof I, any>>> = {
  readonly [K in keyof I]: I[K] extends Readonly<Record<PropertyKey, any>> ? DeriveEntries<E, I[K], O[K]>
    : FormEntry.FormEntry<E, I[K], O[K]>
}

const deriveMakeEntries = <
  R,
  E,
  I extends Readonly<Record<PropertyKey, any>>,
  O extends Readonly<Record<keyof I, any>>
>(
  input: RefSubject<R, E, O> | Fx<R, E, O> | Effect.Effect<R, E, O>,
  ast: AST.AST
): Effect.Effect<R | Scope.Scope, never, DeriveEntries<E, I, O>> =>
  Effect.suspend(() => {
    switch (ast._tag) {
      case "TypeLiteral": {
        const propertySignatures = ast.propertySignatures

        return Effect.gen(function*(_) {
          const entries: any = {}

          for (const prop of propertySignatures) {
            const nested = propOf(input, prop.name)
            const ast = prop.isOptional ? AST.createUnion([prop.type, AST.undefinedKeyword]) : prop.type

            if (prop.type._tag === "TypeLiteral") {
              entries[prop.name] = Form(
                (yield* _(
                  deriveMakeEntries(
                    nested,
                    ast
                  )
                )) as any
              )
            } else {
              entries[prop.name] = yield* _(
                FormEntry.make<any, any>({
                  name: prop.name,
                  schema: S.make(ast)
                })(nested as Fx<R, E, any>)
              )
            }
          }

          return entries
        })
      }
      default: {
        return Effect.die(new TypeError("Form.deriveMakeEntries only supports TypeLiteral schemas."))
      }
    }
  })

const propOf = <R, E, O>(
  input:
    | RefSubject<R, E, O>
    | Computed<R, E, O>
    | Filtered.Filtered<R, E, O>
    | Fx<R, E, O>
    | Effect.Effect<R, E, O>,
  key: keyof O
) => {
  if (RefSubjectTypeId in input || ComputedTypeId in input || FilteredTypeId in input) {
    return input.map((o) => o[key])
  } else if (TypeId in input) return core.map(input, (o) => o[key])
  else return Effect.map(input, (o) => o[key])
}
