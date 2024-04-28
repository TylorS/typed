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
import { RefSubjectTypeId, TypeId } from "./TypeId.js"
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
    extends Versioned.Versioned<R, never, I, E | ParseError, R | Scope.Scope, I, E | ParseError, R>
  {
    readonly [FormTypeId]: FormTypeId

    readonly entries: Entries

    readonly schema: S.Schema<
      O,
      I,
      R
    >

    readonly get: <K extends keyof Entries>(key: K) => Entries[K]

    readonly decoded: RefSubject.Computed<
      O,
      E | ParseError,
      R
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
      Output<Entries>,
      Error<Entries>,
      R2
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
  R0,
  I extends AnyObject,
  O extends AnyObjectWithKeys<keyof I>
> = {
  <E, R>(
    fx: RefSubject.RefSubject<O, E, R>
  ): Effect.Effect<
    [DerivedFromIO<R, never, E, I, O>] extends [Form.Derived<infer R, never, infer R2>] ? Form.Derived<R, never, R2>
      : never,
    never,
    R | Scope.Scope
  >

  <E, R>(
    fx: Fx<O, E, R> | Effect.Effect<O, E, R>
  ): Effect.Effect<
    [FormFromIO<R0, E, I, O>] extends [Form<infer R1, infer R2>] ? Form<R1, R2> : never,
    never,
    R | Scope.Scope
  >
}

/**
 * @since 1.20.0
 */
export type MakeInputForm<
  R0,
  I extends AnyObject,
  O extends AnyObjectWithKeys<keyof I>
> = {
  <E, R>(
    fx: RefSubject.RefSubject<I, E, R>
  ): Effect.Effect<
    [DerivedFromIO<R0 | R, never, E, I, O>] extends [Form.Derived<infer R, infer _, infer R2>] ? Form.Derived<R, _, R2>
      : never,
    never,
    R | Scope.Scope
  >

  <E, R>(
    fx: Fx<I, E, R> | Effect.Effect<I, E, R>
  ): Effect.Effect<
    [FormFromIO<R0, E, I, O>] extends [Form<infer R1, infer R2>] ? Form<R1, R2> : never,
    never,
    R | Scope.Scope
  >
}

/**
 * @since 1.18.0
 */
export type FormFromIO<
  R,
  E,
  I extends AnyObject,
  O extends AnyObjectWithKeys<keyof I>
> = Form<
  R,
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
  R0,
  I extends Partial<Readonly<Record<PropertyKey, any>>>,
  O extends Partial<{ readonly [K in keyof I]: any }>
>(schema: S.Schema<O, I, R0>): MakeForm<R0, I, O> {
  return (input) =>
    Effect.map(deriveMakeEntries(input, schema.ast), (entries) => {
      const form = (Form as any)(entries)

      if (RefSubjectTypeId in input) {
        return Object.assign(form, {
          persist: Effect.matchEffect(form.decoded, {
            onFailure: (error: Fx.Error<typeof input> | ParseError) =>
              isParseError(error) ? Effect.void : input.onFailure(Cause.fail(error)),
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
  R0,
  I extends Partial<Readonly<Record<PropertyKey, any>>>,
  O extends Partial<AnyObjectWithKeys<keyof I>>
>(schema: S.Schema<O, I, R0>): MakeInputForm<R0, I, O> {
  return <E, R>(input: RefSubject.RefSubject<I, E, R> | Fx<I, E, R> | Effect.Effect<I, E, R>) =>
    Effect.map(deriveMakeInputEntries(input, schema.ast), (entries) => {
      const form = (Form as any)(entries)

      if (RefSubjectTypeId in input) {
        return Object.assign(form, {
          persist: Effect.matchEffect(form, {
            onFailure: (error: E | ParseError) =>
              isParseError(error) ? Effect.void : input.onFailure(Cause.fail(error)),
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
  Form.Input<Entries>,
  Form.Error<Entries> | ParseError,
  Form.Context<Entries> | Scope.Scope,
  Form.Input<Entries>,
  Form.Error<Entries> | ParseError,
  Form.Context<Entries>
> implements Form<Form.Context<Entries>, Entries> {
  readonly [FormTypeId]: FormTypeId = FormTypeId
  private _fx: Fx<Form.Input<Entries>, ParseError | Form.Error<Entries>, Scope.Scope>
  readonly version: Effect.Effect<number>

  constructor(readonly entries: Entries) {
    super()

    this.schema = buildSchema(entries)
    this.version = Effect.map(
      // @ts-ignore Infinite type instantiation
      Effect.all(Object.values(entries).map((e) => e.version)) as Effect.Effect<ReadonlyArray<number>>,
      (versions) => versions.reduce((a, b) => a + b, 0)
    )

    this._fx = hold(
      core.skipRepeatsWith(
        core.struct(this.entries as any) as Fx<Form.Input<Entries>, Form.Error<Entries> | ParseError>,
        make(S.encodedSchema(this.schema))
      )
    )
  }

  get: Form<Form.Context<Entries>, Entries>["get"] = (k) => this.entries[k]

  schema: Form<Form.Context<Entries>, Entries>["schema"]

  run<R3>(
    sink: Sink.Sink<Form.Input<Entries>, Form.Error<Entries> | ParseError, R3>
  ): Effect.Effect<unknown, never, R3 | Scope.Scope> {
    return this._fx.run(sink)
  }

  toEffect(): Effect.Effect<Form.Input<Entries>, Form.Error<Entries> | ParseError> {
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
): S.Schema<Form.Output<Entries>, Form.Input<Entries>, Form.Context<Entries>> {
  const schemas: any = {}

  for (const key of Reflect.ownKeys(entries)) {
    const entry = entries[key]

    if (FormTypeId in entry) {
      schemas[key] = buildSchema(entry.entries)
    } else {
      schemas[key] = entry.schema
    }
  }

  return S.Struct(schemas) as any
}

type DeriveEntries<R, E, I extends Readonly<Record<PropertyKey, any>>, O extends Readonly<Record<keyof I, any>>> = {
  readonly [K in keyof I]: I[K] extends Readonly<Record<PropertyKey, any>> ? DeriveEntries<R, E, I[K], O[K]>
    : FormEntry.FormEntry<R, E, I[K], O[K]>
}

const deriveMakeEntries = <
  R,
  E,
  I extends Readonly<Record<PropertyKey, any>>,
  O extends Readonly<Record<keyof I, any>>
>(
  input: RefSubject.RefSubject<O, E, R> | Fx<O, E, R> | Effect.Effect<O, E, R>,
  ast: AST.AST
): Effect.Effect<DeriveEntries<R, E, I, O>, never, R | Scope.Scope> =>
  Effect.suspend(() => {
    switch (ast._tag) {
      case "TypeLiteral": {
        const propertySignatures = ast.propertySignatures

        return Effect.gen(function*() {
          const entries: any = {}

          for (const prop of propertySignatures) {
            const nested = propOf(input, prop.name)
            const ast = prop.isOptional ? AST.Union.make([prop.type, AST.undefinedKeyword]) : prop.type

            if (prop.type._tag === "TypeLiteral") {
              entries[prop.name] = Form(
                (yield* deriveMakeEntries(
                  nested,
                  ast
                )) as any
              )
            } else {
              entries[prop.name] = yield* FormEntry.derive<any, any, any>({
                name: prop.name,
                schema: S.make(ast)
              })(nested as Fx<any, E, R>)
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
  input: RefSubject.RefSubject<I, E, R> | Fx<I, E, R> | Effect.Effect<I, E, R>,
  ast: AST.AST
): Effect.Effect<DeriveEntries<R, E, I, O>, never, R | Scope.Scope> =>
  Effect.suspend(() => {
    switch (ast._tag) {
      case "TypeLiteral": {
        const propertySignatures = ast.propertySignatures

        return Effect.gen(function*() {
          const entries: any = {}

          for (const prop of propertySignatures) {
            const ast = prop.isOptional ? AST.Union.make([prop.type, AST.undefinedKeyword]) : prop.type
            const nested = propOf(input, prop.name)

            if (prop.type._tag === "TypeLiteral") {
              entries[prop.name] = Form(
                (yield* deriveMakeInputEntries(
                  nested,
                  ast
                )) as any
              )
            } else {
              entries[prop.name] = yield* FormEntry.deriveInput<any, any, any>({
                name: prop.name,
                schema: S.make(ast)
              })(nested as Fx<any, E, R>)
            }
          }

          return entries
        })
      }
      default: {
        // TODO: Wrap in an error
        return Effect.die(new TypeError("Form.deriveMakeInputEntries only supports TypeLiteral schemas."))
      }
    }
  })

const propOf = <O, E, R>(
  input:
    | RefSubject.RefSubject<O, E, R>
    | RefSubject.Computed<O, E, R>
    | RefSubject.Filtered<O, E, R>
    | Fx<O, E, R>
    | Effect.Effect<O, E, R>,
  key: keyof O
) => {
  if (TypeId in input) return core.map(input, (o) => o[key])
  else return Effect.map(input, (o) => o[key])
}
