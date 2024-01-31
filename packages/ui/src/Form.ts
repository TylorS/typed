import { AST, Schema } from "@effect/schema"
import type { ParseError } from "@effect/schema/ParseResult"
import * as Fx from "@typed/fx/Fx"
import * as RefSubject from "@typed/fx/RefSubject"
import { ComputedTypeId, RefSubjectTypeId } from "@typed/fx/TypeId"
import type { Scope } from "effect"
import { Effect } from "effect"
import type { Cause } from "effect/Cause"
import type { Simplify } from "effect/Types"
import * as FormEntry from "./FormEntry"

// HasChanged
// HasSubmitted
// ChangedFields
// Errors - find by name
// Opt-in to scrolling to error-fields
// Optional support for progressive enhancement
// Submit to Navigation.submit
// Utilize schema for derivation and validation
// Need a way to control how values are connected to the form for different types of elements

export interface FormControl<Entries extends Readonly<Record<string, FormControl.AnyEntry>>, R = never>
  extends
    RefSubject.RefSubject<
      R | FormControl.Context<Entries>,
      FormControl.Error<Entries> | ParseError,
      FormControl.Input<Entries>
    >
{
  readonly entries: Entries
  readonly get: <K extends keyof Entries>(key: K) => Entries[K]

  readonly decoded: RefSubject.Computed<
    R | FormControl.Context<Entries>,
    FormControl.Error<Entries> | ParseError,
    FormControl.Output<Entries>
  >
}

export namespace FormControl {
  export type AnyEntry = FormEntry.FormEntry.Any | FormControl<{ readonly [key: string]: AnyEntry }>

  export type Context<T> = [T] extends [never] ? never
    : T extends FormControl<infer Entries> ? Context<Entries[string]>
    : T extends FormEntry.FormEntry.Any ? FormEntry.FormEntry.Context<T>
    : never

  export type Error<T> = [T] extends [never] ? never
    : T extends FormControl<infer Entries> ? Error<Entries[string]>
    : T extends FormEntry.FormEntry.Any ? FormEntry.FormEntry.Error<T>
    : never

  export type Input<T> = [T] extends [never] ? never
    : T extends FormControl<infer Entries> ? { readonly [K in keyof Entries]: Input<Entries[K]> }
    : T extends FormEntry.FormEntry.Any ? FormEntry.FormEntry.Input<T>
    : never

  export type Output<T> = [T] extends [never] ? never
    : T extends FormControl<infer Entries> ? { readonly [K in keyof Entries]: Output<Entries[K]> }
    : T extends FormEntry.FormEntry.Any ? FormEntry.FormEntry.Output<T>
    : never

  export type EntriesFromSchema<
    R,
    E,
    I extends Readonly<Record<string, any>>,
    O extends Readonly<Record<keyof I, any>>
  > = [
    {
      readonly [K in keyof I as K extends string ? K : never]: I[K] extends Readonly<Record<string, any>> ? FormControl<
          EntriesFromSchema<R, E, I[K], O[K]>
        > :
        FormEntry.FormEntry<R, E, I[K], O[K]>
    }
  ] extends [infer Ret extends Readonly<Record<string, FormControl.AnyEntry>>] ? Simplify<Ret> : never
}

function fromSchema_<
  R,
  I extends Readonly<Record<string, any>>,
  O extends Readonly<Record<keyof I, any>>,
  R2,
  E2
>(
  schema: Schema.Schema<R, I, O>,
  value: Fx.Fx<R2, E2, O> | Effect.Effect<R2, E2, O>
): Effect.Effect<
  R | R2 | Scope.Scope,
  never,
  { readonly control: FormControl<FormControl.EntriesFromSchema<never, E2, I, O>, R2> }
> {
  const propertySignatures = AST.getPropertySignatures(schema.ast)
  if (propertySignatures.length === 0) {
    throw new Error(`FormControl schemas must be a struct with at least one property`)
  }

  return Effect.gen(function*(_) {
    const entries = {} as any

    for (const signature of propertySignatures) {
      const x = mapInput(value, (value) => value[signature.name as string])
      entries[signature.name as string] = yield* _(FormEntry.fromSchema(Schema.make<R, any, any>(signature.type), x))
    }

    type Entries = FormControl.EntriesFromSchema<never, E2, I, O>

    const control = new FormControlImpl(entries as Entries, schema as any) as FormControl<Entries, R2>

    return {
      control
    }
  })
}

export const fromSchema: {
  <
    R,
    I extends Readonly<Record<string, any>>,
    O extends Readonly<Record<keyof I, any>>
  >(
    schema: Schema.Schema<R, I, O>
  ): <R2, E2>(value: Fx.Fx<R2, E2, O> | Effect.Effect<R2, E2, O>) => Effect.Effect<
    R | R2 | Scope.Scope,
    never,
    { readonly control: FormControl<FormControl.EntriesFromSchema<never, E2, I, O>, R2> }
  >

  <
    R,
    I extends Readonly<Record<string, any>>,
    O extends Readonly<Record<keyof I, any>>,
    R2,
    E2
  >(
    schema: Schema.Schema<R, I, O>,
    value: Fx.Fx<R2, E2, O> | Effect.Effect<R2, E2, O>
  ): Effect.Effect<
    R | R2 | Scope.Scope,
    never,
    { readonly control: FormControl<FormControl.EntriesFromSchema<never, E2, I, O>, R2> }
  >
} = function(): any {
  if (arguments.length === 1) {
    return (value: any) => fromSchema_(arguments[0], value)
  } else {
    return fromSchema_(arguments[0], arguments[1])
  }
}

function mapInput<R, E, A, B>(
  input: Fx.Fx<R, E, A> | Effect.Effect<R, E, A>,
  f: (a: A) => B
): Fx.Fx<R, E, B> | Effect.Effect<R, E, B> {
  if (Fx.isFx(input)) {
    return Fx.map(input, f)
  } else {
    return Effect.map(input, f)
  }
}

// @ts-expect-error Type instantiation is excessively deep and possibly infinite.
class FormControlImpl<Entries extends Readonly<Record<PropertyKey, FormControl.AnyEntry>>, R> extends Fx.FxEffectBase<
  R | FormControl.Context<Entries> | Scope.Scope,
  FormControl.Error<Entries> | ParseError,
  FormControl.Input<Entries>,
  R | FormControl.Context<Entries>,
  FormControl.Error<Entries> | ParseError,
  FormControl.Input<Entries>
> implements FormControl<Entries, R> {
  readonly [RefSubjectTypeId]: RefSubjectTypeId = RefSubjectTypeId
  readonly [ComputedTypeId]: ComputedTypeId = ComputedTypeId

  readonly version: FormControl<Entries, R>["version"]
  readonly subscriberCount: FormControl<Entries, R>["subscriberCount"]
  readonly interrupt: FormControl<Entries, R>["interrupt"]
  readonly runUpdates: FormControl<Entries, R>["runUpdates"]
  readonly decoded: FormControl<Entries, R>["decoded"]

  constructor(
    readonly entries: Entries,
    readonly schema: Schema.Schema<
      R,
      FormControl.Input<Entries>,
      FormControl.Output<Entries>
    >
  ) {
    super()

    this._struct = RefSubject.struct(entries) as unknown as RefSubject.RefSubject<
      R | FormControl.Context<Entries>,
      FormControl.Error<Entries> | ParseError,
      FormControl.Input<Entries>
    >

    this.version = this._struct.version
    this.subscriberCount = this._struct.subscriberCount
    this.interrupt = this._struct.interrupt
    this.runUpdates = this._struct.runUpdates.bind(this._struct)
    this.decoded = RefSubject.mapEffect(this._struct, Schema.decode(schema))
  }

  private _struct: RefSubject.RefSubject<
    R | FormControl.Context<Entries>,
    FormControl.Error<Entries> | ParseError,
    FormControl.Input<Entries>
  >

  toFx(): Fx.Fx<
    R | FormControl.Context<Entries> | Scope.Scope,
    FormControl.Error<Entries> | ParseError,
    FormControl.Input<Entries>
  > {
    return this._struct
  }

  toEffect(): Effect.Effect<
    R | FormControl.Context<Entries>,
    FormControl.Error<Entries> | ParseError,
    FormControl.Input<Entries>
  > {
    return this._struct
  }

  onFailure(
    cause: Cause<FormControl.Error<Entries> | ParseError>
  ): Effect.Effect<R | FormControl.Context<Entries>, never, unknown> {
    return this._struct.onFailure(cause)
  }

  onSuccess(value: FormControl.Input<Entries>): Effect.Effect<R | FormControl.Context<Entries>, never, unknown> {
    return this._struct.onSuccess(value)
  }

  get<K extends keyof Entries>(key: K): Entries[K] {
    return this.entries[key]
  }
}
