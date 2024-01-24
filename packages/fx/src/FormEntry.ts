/**
 * @since 1.18.0
 */
import { Equivalence, Schema } from "@effect/schema"
import type { ParseOptions } from "@effect/schema/AST"
import { type ParseError } from "@effect/schema/ParseResult"
import type { Cause } from "effect/Cause"
import * as Effect from "effect/Effect"
import type * as Scope from "effect/Scope"
import * as Fx from "./Fx.js"
import { FxEffectBase } from "./internal/protos.js"
import * as RefSubject from "./RefSubject.js"
import type * as Sink from "./Sink.js"
import { ComputedTypeId, RefSubjectTypeId } from "./TypeId.js"

/**
 * @since 1.18.0
 */
export interface FormEntry<out R, in out E, in out I, in out O> extends RefSubject.RefSubject<R, E | ParseError, I> {
  readonly name: PropertyKey
  readonly schema: Schema.Schema<R, I, O>
  readonly decoded: RefSubject.Computed<R, E | ParseError, O>
}

/**
 * @since 1.18.0
 */
export namespace FormEntry {
  /**
   * @since 1.18.0
   */
  export interface Derived<R, R2, E, I, O> extends FormEntry<R, E, I, O> {
    readonly persist: Effect.Effect<R2, E | ParseError, O>
  }
}

/**
 * @since 1.18.0
 */
export interface FormEntryOptions<R, I, O> {
  readonly name: PropertyKey
  readonly schema: Schema.Schema<R, I, O>
}

/**
 * MakeRefSubject is a RefSubject factory function dervied from a Schema.
 * @since 1.18.0
 */
/**
 * @since 1.18.0
 */
export type MakeFormEntry<R0, I, O> = {
  <R, E>(
    ref: RefSubject.RefSubject<R, E, O>
  ): Effect.Effect<R0 | R | Scope.Scope, never, FormEntry.Derived<never, R, E, I, O>>
  <R, E>(fx: Fx.Fx<R, E, O>): Effect.Effect<R0 | R | Scope.Scope, never, FormEntry<never, E, I, O>>
  <R, E>(effect: Effect.Effect<R, E, O>): Effect.Effect<R0 | R | Scope.Scope, never, FormEntry<never, E, I, O>>
}

/**
 * MakeRefSubject is a RefSubject factory function dervied from a Schema.
 * @since 1.20.0
 */
export type MakeInputFormEntry<R0, I, O> = {
  <R, E>(
    ref: RefSubject.RefSubject<R, E, I>
  ): Effect.Effect<R | Scope.Scope, never, FormEntry.Derived<R0, R, E, I, O>>
  <R, E>(fx: Fx.Fx<R, E, I>): Effect.Effect<R | Scope.Scope, never, FormEntry<R0, E, I, O>>
  <R, E>(effect: Effect.Effect<R, E, I>): Effect.Effect<R | Scope.Scope, never, FormEntry<R0, E, I, O>>
}

/**
 * @since 1.18.0
 */
export function derive<R, I, O>(options: FormEntryOptions<R, I, O>): MakeFormEntry<R, I, O> {
  const encode = Schema.encode(options.schema)
  const decode = Schema.decode(options.schema)
  const makeFormEntry = <R2, E>(input: RefSubject.RefSubject<R2, E, O> | Fx.Fx<R2, E, O> | Effect.Effect<R2, E, O>) => {
    const initial = Fx.mapEffect(Effect.isEffect(input) ? Fx.fromEffect(input) : input, (o) => encode(o, parseOptions))

    return Effect.map(
      RefSubject.make(initial, {
        eq: Equivalence.make(Schema.from(options.schema))
      }),
      (inputRef): FormEntry<R, E, I, O> | FormEntry.Derived<R, R2, E, I, O> => {
        if (RefSubject.isRefSubject<R2, E, O>(input)) {
          const persist: Effect.Effect<R | R2, ParseError | E, O> = Effect.flatMap(
            Effect.flatMap(
              inputRef,
              (i) => decode(i, parseOptions)
            ),
            (o) => RefSubject.set(input, o)
          )

          return new DerivedFormEntryImpl(
            inputRef,
            options.name,
            options.schema,
            RefSubject.isDerived(input) ? Effect.tap(persist, () => input.persist) : persist
          )
        } else {
          return new FromEntryImpl(inputRef, options.name, options.schema)
        }
      }
    )
  }

  return makeFormEntry as MakeFormEntry<R, I, O>
}

/**
 * @since 1.18.0
 */
export function deriveInput<R, I, O>(options: FormEntryOptions<R, I, O>): MakeInputFormEntry<R, I, O> {
  const decode = Schema.decode(options.schema)
  const makeFormEntry = <R2, E>(input: RefSubject.RefSubject<R2, E, I> | Fx.Fx<R2, E, I> | Effect.Effect<R2, E, I>) => {
    const initial: Fx.Fx<R2, E | ParseError, I> = Effect.isEffect(input) ? Fx.fromEffect(input) : input

    return Effect.map(
      RefSubject.make(initial, { eq: Equivalence.make(Schema.from(options.schema)) }),
      (inputRef): FormEntry<R, E, I, O> | FormEntry.Derived<R, R2, E, I, O> => {
        if (RefSubject.isRefSubject<R2, E, O>(input)) {
          const persist: Effect.Effect<R | R2, ParseError | E, O> = Effect.flatMap(
            Effect.flatMap(
              inputRef,
              (i) => RefSubject.set(input as RefSubject.RefSubject<R2, E, I>, i)
            ),
            (i) => decode(i, parseOptions)
          )

          return new DerivedFormEntryImpl(
            inputRef,
            options.name,
            options.schema,
            RefSubject.isDerived(input) ? Effect.tap(persist, () => input.persist) : persist
          )
        } else {
          return new FromEntryImpl(inputRef, options.name, options.schema)
        }
      }
    )
  }

  return makeFormEntry as MakeInputFormEntry<R, I, O>
}

const parseOptions: ParseOptions = {
  errors: "all",
  onExcessProperty: "ignore"
}

class FromEntryImpl<R, E, I, O> extends FxEffectBase<R | Scope.Scope, E | ParseError, I, R, ParseError | E, I>
  implements FormEntry<R, E, I, O>
{
  readonly [ComputedTypeId]: ComputedTypeId = ComputedTypeId
  readonly [RefSubjectTypeId]: RefSubjectTypeId = RefSubjectTypeId

  readonly decoded: RefSubject.Computed<R, ParseError | E, O>
  readonly version: Effect.Effect<never, ParseError | E, number>
  readonly subscriberCount: Effect.Effect<never, never, number>
  readonly interrupt: Effect.Effect<never, never, void>

  constructor(
    readonly ref: RefSubject.RefSubject<never, E | ParseError, I>,
    readonly name: PropertyKey,
    readonly schema: Schema.Schema<R, I, O>
  ) {
    super()

    const decode = Schema.decode(schema)
    this.decoded = RefSubject.mapEffect(ref, (i) => decode(i, parseOptions))
    this.version = ref.version
    this.subscriberCount = ref.subscriberCount
    this.interrupt = ref.interrupt
  }

  run<R3>(sink: Sink.Sink<R3, E | ParseError, I>): Effect.Effect<R3 | Scope.Scope, never, unknown> {
    return this.ref.run(sink)
  }

  toEffect(): Effect.Effect<never, E | ParseError, I> {
    return this.ref
  }

  runUpdates<R2, E2, B>(
    f: (ref: RefSubject.GetSetDelete<never, E | ParseError, I>) => Effect.Effect<R2, E2, B>
  ): Effect.Effect<R2, E2, B> {
    return this.ref.runUpdates(f)
  }

  onFailure(cause: Cause<E | ParseError>): Effect.Effect<never, never, unknown> {
    return this.ref.onFailure(cause)
  }

  onSuccess(value: I): Effect.Effect<never, never, unknown> {
    return this.ref.onSuccess(value)
  }
}

class DerivedFormEntryImpl<R, R2, E, I, O> extends FromEntryImpl<R, E, I, O>
  implements FormEntry.Derived<R, R2, E, I, O>
{
  constructor(
    ref: RefSubject.RefSubject<never, E | ParseError, I>,
    name: PropertyKey,
    schema: Schema.Schema<R, I, O>,
    readonly persist: Effect.Effect<R2, E | ParseError, O>
  ) {
    super(ref, name, schema)
  }
}
