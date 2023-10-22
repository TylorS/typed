import type { ParseOptions } from "@effect/schema/AST"
import type { ParseError } from "@effect/schema/dist/declarations/src/ParseResult"
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

export interface Form<Entries extends Form.AnyEntries> extends
  Versioned.Versioned<
    Form.Context<Entries>,
    Form.Context<Entries>,
    Form.Error<Entries> | ParseError,
    Form.Input<Entries>,
    Form.Context<Entries>,
    Form.Error<Entries> | ParseError,
    Form.Input<Entries>
  >
{
  readonly [FormTypeId]: FormTypeId

  readonly entries: Entries

  readonly schema: S.Schema<
    Form.Input<Entries>,
    Form.Output<Entries>
  >

  readonly fromKey: <K extends keyof Entries>(key: K) => Entries[K]

  readonly decoded: Computed<
    Form.Context<Entries>,
    Form.Error<Entries> | ParseError,
    Form.Output<Entries>
  >
}

export namespace Form {
  export type AnyEntry = FormEntry.FormEntry<any, any, any, any> | Form<any>

  export type AnyEntries = Readonly<Record<PropertyKey, AnyEntry>>

  export type Context<T> = T extends FormEntry.FormEntry<infer R, infer _E, infer _I, infer _> ? R :
    T extends Form<infer Entries> ? Context<Entries[keyof Entries]> :
    never

  export type Error<T> = T extends FormEntry.FormEntry<infer _R, infer E, infer _I, infer _> ? E :
    T extends Form<infer Entries> ? Error<Entries[keyof Entries]> :
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
      Form.Error<Entries[keyof Entries]> | ParseError,
      Form.Output<Entries[keyof Entries]>
    >
  }
}

export function Form<Entries extends Form.AnyEntries>(entries: Entries): Form<Entries> {
  return new FormImpl(entries) as any
}

export type MakeForm<
  I extends Readonly<Record<PropertyKey, any>>,
  O extends Readonly<Record<keyof I, any>>
> = {
  <R, E>(fx: RefSubject<R, E, O>): Effect.Effect<
    R | Scope.Scope,
    never,
    Form.Derived<
      R,
      {
        readonly [K in keyof I]: FormEntry.FormEntry<R, E, I[K], O[K]>
      }
    >
  >

  <R, E>(fx: Fx<R, E, O>): Effect.Effect<
    R | Scope.Scope,
    never,
    FormFromIO<E, I, O>
  >

  <R, E>(stream: Stream.Stream<R, E, O>): Effect.Effect<
    R | Scope.Scope,
    never,
    FormFromIO<E, I, O>
  >

  <R, E>(effect: Effect.Effect<R, E, O>): Effect.Effect<
    R,
    never,
    FormFromIO<E, I, O>
  >
}

export type FormFromIO<E, I extends Readonly<Record<PropertyKey, any>>, O extends Readonly<Record<keyof I, any>>> =
  Form<
    {
      readonly [K in keyof I]: FormEntry.FormEntry<never, E, I[K], O[K]>
    }
  >

export function make<
  I extends Readonly<Record<PropertyKey, any>>,
  O extends Readonly<Record<keyof I, any>>
>(schema: S.Schema<I, O>): MakeForm<I, O> {
  return (input) =>
    Effect.map(deriveMakeEntries(input, schema), (entries) => {
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

  fromKey: Form<Entries>["fromKey"] = (k) => this.entries[k]

  schema: Form<Entries>["schema"] = buildSchema(this.entries)

  version: Form<Entries>["version"] = Effect.map(
    // @ts-ignore Infinite type instantiation
    Effect.all(Object.values(this.entries).map((e) => e.version)) as Effect.Effect<
      Form.Context<Entries>,
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
  schema: S.Schema<I, O>
): Effect.Effect<R | Scope.Scope, never, DeriveMakeEntries<E, I, O>> =>
  Effect.suspend(() => {
    switch (schema.ast._tag) {
      case "TypeLiteral": {
        const propertySignatures = schema.ast.propertySignatures

        return Effect.gen(function*(_) {
          const entries: any = {}

          for (const prop of propertySignatures) {
            const nested = propOf(input, prop.name)
            if (prop.type._tag === "TypeLiteral") {
              entries[prop.name] = yield* _(deriveMakeEntries(nested, S.make(prop.type) as any))
            } else {
              const makeEntry = FormEntry.make<any, any>({ name: prop.name, schema: S.make(prop.type) })
              entries[prop.name] = yield* _(makeEntry(nested as Fx<R, E, any>))
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
