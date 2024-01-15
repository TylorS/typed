/**
 * @since 1.18.0
 */
import { AST } from "@effect/schema"
import { type ParseOptions } from "@effect/schema/AST"
import { make } from "@effect/schema/Equivalence"
import type { ParseError } from "@effect/schema/ParseResult"
import * as S from "@effect/schema/Schema"
import * as Cause from "effect/Cause"
import * as Effect from "effect/Effect"
import { hasProperty } from "effect/Predicate"
import type * as Scope from "effect/Scope"
import * as FormEntry from "./FormEntry.js"
import type { Fx } from "./Fx.js"
import * as core from "./internal/core.js"
import { FxEffectBase } from "./internal/protos.js"
import { hold } from "./internal/share.js"
import * as RefSubject from "./RefSubject.js"
import type * as Sink from "./Sink.js"
import { ComputedTypeId, FilteredTypeId, RefSubjectTypeId, TypeId } from "./TypeId.js"
import type * as Versioned from "./Versioned.js"

/**
 * @since 1.18.0
 */
export const FormTypeId = Symbol.for("@typed/fx/Form")
/**
 * @since 1.18.0
 */
export type FormTypeId = typeof FormTypeId

type AnyObject = Readonly<Record<PropertyKey, any>>
type AnyObjectWithKeys<K extends PropertyKey> = Readonly<Record<K, any>>

/**
 * @since 1.18.0
 */
export interface Form<out R, in out Entries extends Form.AnyEntries> extends
  Form.Base<
    R | Form.Context<Entries>,
    Form.Error<Entries>,
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
  export interface Base<out R, out E, in out I, in out O, in out Entries extends Form.AnyEntries>
    extends Versioned.Versioned<R, never, R | Scope.Scope, E | ParseError, I, R, E | ParseError, I>
  {
    readonly [FormTypeId]: FormTypeId

    readonly entries: Entries

    readonly schema: S.Schema<
      I,
      O
    >

    readonly get: <K extends keyof Entries>(key: K) => Entries[K]

    readonly decoded: RefSubject.Computed<
      R,
      E | ParseError,
      O
    >
  }

  /**
   * @since 1.18.0
   */
  export type AnyEntry =
    | FormEntry.FormEntry<any, any, any, any>
    | FormEntry.FormEntry<any, never, any, any>
    | FormEntry.FormEntry<any, any, never, any>
    | FormEntry.FormEntry<any, never, never, any>
    | Base<any, any, any, any, any>
    | Base<any, never, any, any, any>
    | Base<any, any, never, any, any>
    | Base<any, never, never, any, any>

  /**
   * @since 1.18.0
   */
  export type AnyEntries = Readonly<Record<PropertyKey, AnyEntry>>

  /**
   * @since 1.20.0
   */
  export type Context<T> = [T] extends [FormEntry.FormEntry<infer R, infer _E, infer _I, infer _>] ? R :
    [T] extends [Base<infer _R, infer _E, infer _I, infer _O, infer _Entries>] ?
      _R | Context<_Entries[keyof _Entries]> :
    never

  /**
   * @since 1.18.0
   */
  export type Error<T> = [T] extends [FormEntry.FormEntry<infer _R, infer E, infer _I, infer _>] ? E :
    [T] extends [Base<infer _R, infer _E, infer _I, infer _O, infer _Entries>] ? _E :
    never

  /**
   * @since 1.18.0
   */
  export type Input<T> = [T] extends [FormEntry.FormEntry<infer _R, infer _E, infer I, infer _>] ? I :
    T extends Form<infer _R, infer Entries> ? {
        readonly [K in keyof Entries]: Input<Entries[K]>
      } :
    T extends AnyEntries ? {
        readonly [K in keyof T]: Input<T[K]>
      } :
    never

  /**
   * @since 1.18.0
   */
  export type Output<T> = [T] extends [FormEntry.FormEntry<infer _R, infer _E, infer _I, infer O>] ? O :
    T extends Form<infer _R, infer Entries> ? {
        readonly [K in keyof Entries]: Output<Entries[K]>
      } :
    T extends AnyEntries ? {
        readonly [K in keyof T]: Output<T[K]>
      } :
    never

  /**
   * @since 1.18.0
   */
  export interface Derived<R, R2, Entries extends AnyEntries> extends Form<R, Entries> {
    readonly persist: Effect.Effect<
      R2,
      Error<Entries>,
      Output<Entries>
    >
  }
}

/**
 * @since 1.18.0
 */
export function Form<Entries extends Form.AnyEntries>(entries: Entries): Form<Form.Context<Entries>, Entries> {
  return new FormImpl(entries) as any
}

/**
 * @since 1.18.0
 */
export type MakeForm<
  I extends AnyObject,
  O extends AnyObjectWithKeys<keyof I>
> = {
  <R, E>(fx: RefSubject.RefSubject<R, E, O>): Effect.Effect<
    R | Scope.Scope,
    never,
    [DerivedFromIO<R, never, E, I, O>] extends [Form.Derived<infer R, never, infer R2>] ? Form.Derived<R, never, R2>
      : never
  >

  <R, E>(fx: Fx<R, E, O> | Effect.Effect<R, E, O>): Effect.Effect<
    R | Scope.Scope,
    never,
    [FormFromIO<E, I, O>] extends [Form<never, infer R>] ? Form<never, R> : never
  >
}

/**
 * @since 1.20.0
 */
export type MakeInputForm<
  I extends AnyObject,
  O extends AnyObjectWithKeys<keyof I>
> = {
  <R, E>(fx: RefSubject.RefSubject<R, E, I>): Effect.Effect<
    R | Scope.Scope,
    never,
    [DerivedFromIO<R, never, E, I, O>] extends [Form.Derived<infer R, never, infer R2>] ? Form.Derived<R, never, R2>
      : never
  >

  <R, E>(fx: Fx<R, E, I> | Effect.Effect<R, E, I>): Effect.Effect<
    R | Scope.Scope,
    never,
    [FormFromIO<E, I, O>] extends [Form<never, infer R>] ? Form<never, R> : never
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
  never,
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
      never,
      [FormEntriesFromIO<E, I[K], O[K]>] extends [infer R] ? { readonly [K in keyof R]: R[K] } : never
    > :
    FormEntry.FormEntry<never, E, I[K], O[K]>
}

/**
 * @since 1.18.0
 */
export type DerivedFromIO<
  R,
  R2,
  E,
  I extends Readonly<Record<PropertyKey, any>>,
  O extends Readonly<Record<keyof I, any>>
> = Form.Derived<
  R,
  R2,
  {
    readonly [K in keyof I]-?: FormEntry.FormEntry<never, E, I[K], O[K]>
  }
>

/**
 * @since 1.20.0
 */
export function derive<
  I extends Partial<Readonly<Record<PropertyKey, any>>>,
  O extends Partial<AnyObjectWithKeys<keyof I>>
>(schema: S.Schema<I, O>): MakeForm<I, O> {
  return (input) =>
    Effect.map(deriveMakeEntries(input, schema.ast), (entries) => {
      const form = (Form as any)(entries)

      if (RefSubjectTypeId in input) {
        return Object.assign(form, {
          persist: Effect.matchEffect(form.decoded, {
            onFailure: (error: Fx.Error<typeof input> | ParseError) =>
              isParseError(error) ? Effect.unit : input.onFailure(Cause.fail(error)),
            onSuccess: (a: O) => input.onSuccess(a)
          })
        })
      }

      return form
    })
}

/**
 * @since 1.18.0
 */
export function deriveInput<
  I extends Partial<Readonly<Record<PropertyKey, any>>>,
  O extends Partial<AnyObjectWithKeys<keyof I>>
>(schema: S.Schema<I, O>): MakeInputForm<I, O> {
  return <R, E>(input: RefSubject.RefSubject<R, E, I> | Fx<R, E, I> | Effect.Effect<R, E, I>) =>
    Effect.map(deriveMakeInputEntries(input, schema.ast), (entries) => {
      const form = (Form as any)(entries)

      if (RefSubjectTypeId in input) {
        return Object.assign(form, {
          persist: Effect.matchEffect(form, {
            onFailure: (error: E | ParseError) =>
              isParseError(error) ? Effect.unit : input.onFailure(Cause.fail(error)),
            onSuccess: (a: I) => input.onSuccess(a)
          })
        })
      }

      return form
    })
}

function isParseError(u: unknown): u is ParseError {
  return hasProperty(u, "_tag") && u["_tag"] === "ParseError"
}

const parseOptions: ParseOptions = { errors: "all", onExcessProperty: "ignore" }

class FormImpl<Entries extends Form.AnyEntries> extends FxEffectBase<
  Form.Context<Entries> | Scope.Scope,
  Form.Error<Entries> | ParseError,
  Form.Input<Entries>,
  Form.Context<Entries>,
  Form.Error<Entries> | ParseError,
  Form.Input<Entries>
> implements Form<Form.Context<Entries>, Entries> {
  readonly [FormTypeId]: FormTypeId = FormTypeId
  private _fx: Fx<Scope.Scope, ParseError | Form.Error<Entries>, Form.Input<Entries>>
  readonly version: Effect.Effect<never, never, number>

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

    this._fx = hold(
      core.skipRepeatsWith(
        core.struct(this.entries as any) as Fx<never, Form.Error<Entries> | ParseError, Form.Input<Entries>>,
        make(S.from(this.schema))
      )
    )
  }

  get: Form<Form.Context<Entries>, Entries>["get"] = (k) => this.entries[k]

  schema: Form<Form.Context<Entries>, Entries>["schema"]

  run<R3>(
    sink: Sink.Sink<R3, Form.Error<Entries> | ParseError, Form.Input<Entries>>
  ): Effect.Effect<R3 | Scope.Scope, never, unknown> {
    return this._fx.run(sink)
  }

  toEffect(): Effect.Effect<
    never,
    Form.Error<Entries> | ParseError,
    Form.Input<Entries>
  > {
    return (
      Effect.all(this.entries, { concurrency: "unbounded" }) as any
    )
  }

  decoded: Form<Form.Context<Entries>, Entries>["decoded"] = RefSubject.mapEffect(
    this,
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
    : FormEntry.FormEntry<never, E, I[K], O[K]>
}

const deriveMakeEntries = <
  R,
  E,
  I extends Readonly<Record<PropertyKey, any>>,
  O extends Readonly<Record<keyof I, any>>
>(
  input: RefSubject.RefSubject<R, E, O> | Fx<R, E, O> | Effect.Effect<R, E, O>,
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
                FormEntry.derive<any, any>({
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
        // TODO: Wrap in an error
        return Effect.die(new TypeError("Form.deriveMakeEntries only supports TypeLiteral schemas."))
      }
    }
  })

const deriveMakeInputEntries = <
  R,
  E,
  I extends Readonly<Record<PropertyKey, any>>,
  O extends Readonly<Record<keyof I, any>>
>(
  input: RefSubject.RefSubject<R, E, I> | Fx<R, E, I> | Effect.Effect<R, E, I>,
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
                  deriveMakeInputEntries(
                    nested,
                    ast
                  )
                )) as any
              )
            } else {
              entries[prop.name] = yield* _(
                FormEntry.deriveInput<any, any>({
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
        // TODO: Wrap in an error
        return Effect.die(new TypeError("Form.deriveMakeEntries only supports TypeLiteral schemas."))
      }
    }
  })

const propOf = <R, E, O>(
  input:
    | RefSubject.RefSubject<R, E, O>
    | RefSubject.Computed<R, E, O>
    | RefSubject.Filtered<R, E, O>
    | Fx<R, E, O>
    | Effect.Effect<R, E, O>,
  key: keyof O
) => {
  if (RefSubjectTypeId in input || ComputedTypeId in input || FilteredTypeId in input) {
    return RefSubject.map(input, (o) => o[key])
  } else if (TypeId in input) return core.map(input, (o) => o[key])
  else return Effect.map(input, (o) => o[key])
}
