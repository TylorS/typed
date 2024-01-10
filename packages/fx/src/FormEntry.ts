/**
 * @since 1.18.0
 */
import { Schema } from "@effect/schema"
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
  readonly schema: Schema.Schema<I, O>
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
export interface FormEntryOptions<I, O> {
  readonly name: PropertyKey
  readonly schema: Schema.Schema<I, O>
}

/**
 * MakeRefSubject is a RefSubject factory function dervied from a Schema.
 * @since 1.18.0
 */
/**
 * @since 1.18.0
 */
export type MakeFormEntry<I, O> = {
  <R, E>(
    ref: RefSubject.RefSubject<R, E, O>
  ): Effect.Effect<R | Scope.Scope, never, FormEntry.Derived<never, R, E, I, O>>
  <R, E>(fx: Fx.Fx<R, E, O>): Effect.Effect<R | Scope.Scope, never, FormEntry<never, E, I, O>>
  <R, E>(effect: Effect.Effect<R, E, O>): Effect.Effect<R, never, FormEntry<never, E, I, O>>
}

/**
 * MakeRefSubject is a RefSubject factory function dervied from a Schema.
 * @since 1.20.0
 */
export type MakeInputFormEntry<I, O> = {
  <R, E>(
    ref: RefSubject.RefSubject<R, E, I>
  ): Effect.Effect<R | Scope.Scope, never, FormEntry.Derived<never, R, E, I, O>>
  <R, E>(fx: Fx.Fx<R, E, I>): Effect.Effect<R | Scope.Scope, never, FormEntry<never, E, I, O>>
  <R, E>(effect: Effect.Effect<R, E, I>): Effect.Effect<R, never, FormEntry<never, E, I, O>>
}

/**
 * @since 1.18.0
 */
export function derive<I, O>(options: FormEntryOptions<I, O>): MakeFormEntry<I, O> {
  const encode = Schema.encode(options.schema)
  const decode = Schema.decode(options.schema)
  const makeFormEntry = <R, E>(input: RefSubject.RefSubject<R, E, O> | Fx.Fx<R, E, O> | Effect.Effect<R, E, O>) => {
    const initial = Fx.mapEffect(Effect.isEffect(input) ? Fx.fromEffect(input) : input, (o) => encode(o, parseOptions))

    return Effect.map(
      RefSubject.make(initial),
      (inputRef): FormEntry<never, E, I, O> | FormEntry.Derived<never, R, E, I, O> => {
        if (RefSubject.isRefSubject<R, E, O>(input)) {
          const persist = Effect.flatMap(
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

  return makeFormEntry as MakeFormEntry<I, O>
}

/**
 * @since 1.18.0
 */
export function deriveInput<I, O>(options: FormEntryOptions<I, O>): MakeInputFormEntry<I, O> {
  const decode = Schema.decode(options.schema)
  const makeFormEntry = <R, E>(input: RefSubject.RefSubject<R, E, I> | Fx.Fx<R, E, I> | Effect.Effect<R, E, I>) => {
    const initial: Fx.Fx<R, E | ParseError, I> = Effect.isEffect(input) ? Fx.fromEffect(input) : input

    return Effect.map(
      RefSubject.make(initial),
      (inputRef): FormEntry<never, E, I, O> | FormEntry.Derived<never, R, E, I, O> => {
        if (RefSubject.isRefSubject<R, E, O>(input)) {
          const persist = Effect.flatMap(
            Effect.flatMap(
              inputRef,
              (i) => RefSubject.set(input as RefSubject.RefSubject<R, E, I>, i)
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

  return makeFormEntry as MakeInputFormEntry<I, O>
}

const parseOptions: ParseOptions = {
  errors: "all",
  onExcessProperty: "ignore"
}

class FromEntryImpl<E, I, O> extends FxEffectBase<Scope.Scope, E | ParseError, I, never, ParseError | E, I>
  implements FormEntry<never, E, I, O>
{
  readonly [ComputedTypeId]: ComputedTypeId = ComputedTypeId
  readonly [RefSubjectTypeId]: RefSubjectTypeId = RefSubjectTypeId

  readonly decoded: RefSubject.Computed<never, ParseError | E, O>
  readonly version: Effect.Effect<never, ParseError | E, number>
  readonly subscriberCount: Effect.Effect<never, never, number>
  readonly interrupt: Effect.Effect<never, never, void>

  constructor(
    readonly ref: RefSubject.RefSubject<never, E | ParseError, I>,
    readonly name: PropertyKey,
    readonly schema: Schema.Schema<I, O>
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

class DerivedFormEntryImpl<R, E, I, O> extends FromEntryImpl<E, I, O> implements FormEntry.Derived<never, R, E, I, O> {
  constructor(
    ref: RefSubject.RefSubject<never, E | ParseError, I>,
    name: PropertyKey,
    schema: Schema.Schema<I, O>,
    readonly persist: Effect.Effect<R, E | ParseError, O>
  ) {
    super(ref, name, schema)
  }
}
