import { AST } from "@effect/schema"
import type { ParseOptions } from "@effect/schema/AST"
import type { ParseError } from "@effect/schema/ParseResult"
import * as S from "@effect/schema/Schema"
import { Computed } from "@typed/fx/Computed"
import * as FormEntry from "@typed/fx/FormEntry"
import type { Fx } from "@typed/fx/Fx"
import * as core from "@typed/fx/internal/core"
import { FxEffectProto } from "@typed/fx/internal/fx-effect-proto"
import type { ModuleAgumentedEffectKeysToOmit } from "@typed/fx/internal/protos"
import type { RefSubject } from "@typed/fx/RefSubject"
import { RefSubjectTypeId, TypeId } from "@typed/fx/TypeId"
import type * as Versioned from "@typed/fx/Versioned"
import type { Scope } from "effect"
import { Effect } from "effect"
import * as Stream from "effect/Stream"

export const FormTypeId = Symbol.for("@typed/fx/Form")
export type FormTypeId = typeof FormTypeId

type AnyObject = Readonly<Record<PropertyKey, any>>
type AnyObjectWithKeys<K extends PropertyKey> = Readonly<Record<K, any>>

export interface Form<Entries extends Form.AnyEntries> extends
  Form.Base<
    Form.Context<Entries[keyof Entries]>,
    Form.Error<Entries[keyof Entries]>,
    Form.Input<Entries>,
    Form.Output<Entries>,
    Entries
  >
{}

export namespace Form {
  /**
   * Base interface is to improve type-checking performance by memoizing the derived R, E, I, and O values.
   */
  export interface Base<R, E, I, O, Entries extends Form.AnyEntries>
    extends Versioned.Versioned<R, R, E | ParseError, I, R, E | ParseError, I>
  {
    readonly [FormTypeId]: FormTypeId

    readonly entries: Entries

    readonly schema: S.Schema<
      I,
      O
    >

    readonly fromKey: <K extends keyof Entries>(key: K) => Entries[K]

    readonly decoded: Computed<
      R,
      E | ParseError,
      O
    >
  }

  export type AnyEntry = FormEntry.FormEntry<any, any, any, any> | Base<any, any, any, any, any>

  export type AnyEntries = Readonly<Record<PropertyKey, AnyEntry>>

  export type Context<T> = T extends FormEntry.FormEntry<infer R, infer _E, infer _I, infer _> ? R :
    [T] extends [Base<infer R, infer _E, infer _I, infer _O, infer _Entries>] ? R :
    never

  export type Error<T> = T extends FormEntry.FormEntry<infer _R, infer E, infer _I, infer _> ? E :
    [T] extends [Base<infer _R, infer _E, infer _I, infer _O, infer _Entries>] ? _E :
    never

  export type Input<T> = T extends FormEntry.FormEntry<infer _R, infer _E, infer I, infer _> ? I :
    T extends Form<infer Entries> ? {
        readonly [K in keyof Entries]: Input<Entries[K]>
      } :
    never

  export type Output<T> = T extends FormEntry.FormEntry<infer _R, infer _E, infer _I, infer O> ? O :
    T extends Form<infer Entries> ? {
        readonly [K in keyof Entries]: Output<Entries[K]>
      } :
    never

  export interface Derived<R, Entries extends AnyEntries> extends Form<Entries> {
    readonly persist: Effect.Effect<
      R,
      Error<Entries>,
      Output<Entries>
    >
  }
}

export function Form<Entries extends Form.AnyEntries>(entries: Entries): Form<Entries> {
  return new FormImpl(entries) as any
}

export type MakeForm<
  I extends AnyObject,
  O extends AnyObjectWithKeys<keyof I>
> = {
  <R, E>(fx: RefSubject<R, E, O>): Effect.Effect<
    R | Scope.Scope,
    never,
    [DerviedFromIO<R, E, I, O>] extends [Form.Derived<infer R, infer R2>] ? Form.Derived<R, R2> : never
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

  <R, E>(stream: Stream.Stream<R, E, O>): Effect.Effect<
    R | Scope.Scope,
    never,
    [FormFromIO<E, I, O>] extends [Form<infer R>] ? Form<R> : never
  >
}

export type FormFromIO<
  E,
  I extends AnyObject,
  O extends AnyObjectWithKeys<keyof I>
> = Form<
  [FormEntriesFromIO<E, I, O>] extends [infer R] ? { readonly [K in keyof R]: R[K] } : never
>

export type FormEntriesFromIO<
  E,
  I extends AnyObject,
  O extends AnyObjectWithKeys<keyof I>
> = {
  readonly [K in keyof I]-?: [I[K], O[K]] extends [AnyObject, AnyObjectWithKeys<keyof I[K]>] ? Form<
      [FormEntriesFromIO<E, I[K], O[K]>] extends [infer R] ? { readonly [K in keyof R]: R[K] } : never
    > :
    FormEntry.FormEntry<never, E, I[K], O[K]>
}

export type DerviedFromIO<
  R,
  E,
  I extends Readonly<Record<PropertyKey, any>>,
  O extends Readonly<Record<keyof I, any>>
> = Form.Derived<
  R,
  {
    readonly [K in keyof I]-?: FormEntry.FormEntry<never, E, I[K], O[K]>
  }
>

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

class FormImpl<Entries extends Form.AnyEntries> extends FxEffectProto<
  Form.Context<Entries>,
  Form.Error<Entries> | ParseError,
  Form.Input<Entries>,
  Form.Context<Entries>,
  Form.Error<Entries> | ParseError,
  Form.Input<Entries>
> implements Omit<Form<Entries>, ModuleAgumentedEffectKeysToOmit> {
  readonly [FormTypeId]: FormTypeId = FormTypeId

  constructor(readonly entries: Entries) {
    super()
  }

  fromKey: Form<Entries>["fromKey"] = (k) => this.entries[k] as any

  schema: Form<Entries>["schema"] = buildSchema(this.entries)

  version: Form<Entries>["version"] = Effect.map(
    // @ts-ignore Infinite type instantiation
    Effect.all(Object.values(this.entries).map((e) => e.version)) as Effect.Effect<
      Form.Context<Entries[keyof Entries]>,
      never,
      ReadonlyArray<number>
    >,
    (versions) => versions.reduce((a, b) => a + b, 0)
  )

  toFx(): Fx<
    Form.Context<Entries>,
    Form.Error<Entries> | ParseError,
    Form.Input<Entries>
  > {
    return core.struct(this.entries as any) as any
  }

  toEffect(): Effect.Effect<
    Form.Context<Entries>,
    Form.Error<Entries> | ParseError,
    Form.Input<Entries>
  > {
    return (
      Effect.all(this.entries as any, { concurrency: "unbounded" }) as any
    )
  }

  get decoded(): Form<Entries>["decoded"] {
    return Computed(
      this as any as Form<Entries>,
      (i) => S.decode(this.schema)(i, parseOptions)
    )
  }
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

type DeriveMakeEntries<E, I extends Readonly<Record<PropertyKey, any>>, O extends Readonly<Record<keyof I, any>>> = {
  readonly [K in keyof I]: I[K] extends Readonly<Record<PropertyKey, any>> ? DeriveMakeEntries<E, I[K], O[K]>
    : FormEntry.FormEntry<never, E, I[K], O[K]>
}

const deriveMakeEntries = <
  R,
  E,
  I extends Readonly<Record<PropertyKey, any>>,
  O extends Readonly<Record<keyof I, any>>
>(
  input: RefSubject<R, E, O> | Fx<R, E, O> | Stream.Stream<R, E, O> | Effect.Effect<R, E, O>,
  ast: AST.AST
): Effect.Effect<R | Scope.Scope, never, DeriveMakeEntries<E, I, O>> =>
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
  input: RefSubject<R, E, O> | Fx<R, E, O> | Stream.Stream<R, E, O> | Effect.Effect<R, E, O>,
  key: keyof O
) => {
  if (RefSubjectTypeId in input) return input.map((o) => o[key])
  else if (TypeId in input) return core.map(input, (o) => o[key])
  else if (Effect.EffectTypeId in input) return Effect.map(input, (o) => o[key])
  else return Stream.map(input, (o) => o[key])
}
