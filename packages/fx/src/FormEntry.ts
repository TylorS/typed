import { Schema } from "@effect/schema"
import type { ParseOptions } from "@effect/schema/AST"
import * as schemaEquivalence from "@effect/schema/Equivalence"
import { type ParseError } from "@effect/schema/ParseResult"
import type { RefSubject } from "@typed/fx"
import type { Computed } from "@typed/fx/Computed"
import { type Fx, run } from "@typed/fx/Fx"
import * as core from "@typed/fx/internal/core"
import { RefSubjectImpl } from "@typed/fx/internal/core-ref-subject"
import { makeHoldSubject } from "@typed/fx/internal/core-subject"
import { DeferredRef } from "@typed/fx/internal/deferred-ref"
import { Sink } from "@typed/fx/Sink"
import { RefSubjectTypeId, TypeId } from "@typed/fx/TypeId"
import { Deferred, Effect, Exit, Ref } from "effect"
import type { Scope } from "effect"
import * as Option from "effect/Option"
import { type Stream, StreamTypeId } from "effect/Stream"

export interface FormEntry<in out E, in out I, in out O> extends RefSubject.RefSubject<never, E | ParseError, I> {
  readonly name: PropertyKey
  readonly schema: Schema.Schema<I, O>
  readonly decoded: Computed<never, E | ParseError, O>
}

export namespace FormEntry {
  export interface Derived<R, E, I, O> extends FormEntry<E, I, O> {
    readonly persist: Effect.Effect<R, E | ParseError, O>
  }
}

export interface FormEntryOptions<I, O> {
  readonly name: PropertyKey
  readonly schema: Schema.Schema<I, O>
}

/**
 * MakeRefSubject is a RefSubject factory function dervied from a Schema.
 * @since 1.18.0
 */
export type MakeFormEntry<I, O> = {
  <R, E>(
    ref: RefSubject.RefSubject<R, E, O>
  ): Effect.Effect<R | Scope.Scope, never, FormEntry.Derived<R, E, I, O>>
  <R, E>(fx: Fx<R, E, O>): Effect.Effect<R | Scope.Scope, never, FormEntry<E, I, O>>
  <R, E>(stream: Stream<R, E, O>): Effect.Effect<R | Scope.Scope, never, FormEntry<E, I, O>>
  <R, E>(effect: Effect.Effect<R, E, O>): Effect.Effect<R, never, FormEntry<E, I, O>>
}

export function make<I, O>(options: FormEntryOptions<I, O>): MakeFormEntry<I, O> {
  return (<R, E>(input: RefSubject.RefSubject<R, E, O> | Fx<R, E, O> | Stream<R, E, O> | Effect.Effect<R, E, O>) => {
    if (RefSubjectTypeId in input) {
      return makeDerivedFormEntry(input, options)
    } else if (TypeId in input) {
      return makeFxFormEntry(input, options)
    } else if (StreamTypeId in input) {
      return makeFxFormEntry(core.fromStream(input), options)
    } else {
      return makeEffectFormEntry(input, options)
    }
  }) as MakeFormEntry<I, O>
}

const parseOptions: ParseOptions = {
  errors: "all",
  onExcessProperty: "ignore"
}

function makeEffectFormEntry<R, E, I, O>(
  input: Effect.Effect<R, E, O>,
  options: FormEntryOptions<I, O>
): Effect.Effect<R, never, FormEntry<E, I, O>> {
  return Effect.contextWith((ctx) =>
    FormEntryImpl.formEntry(
      Effect.provide(Effect.flatMap(input, (i) => Schema.encode(options.schema)(i, parseOptions)), ctx),
      options.name,
      options.schema
    )
  )
}

function makeFxFormEntry<R, E, I, O>(
  input: Fx<R, E, O>,
  options: FormEntryOptions<I, O>
): Effect.Effect<R | Scope.Scope, never, FormEntry<E, I, O>> {
  const encode_ = Schema.encode(options.schema)

  return Effect.gen(function*(_) {
    const deferred = new DeferredRef(yield* _(Deferred.make<E | ParseError, I>()))
    const entry = FormEntryImpl.formEntry(
      deferred,
      options.name,
      options.schema
    )

    const done = (exit: Exit.Exit<E, O>) =>
      Effect.flatMap(
        Effect.exit(Effect.flatMap(exit, encode_)),
        (exit) =>
          Effect.flatMap(deferred.done(exit), (closed) => {
            if (closed) return Effect.unit

            return Exit.match(exit, entry)
          })
      )

    yield* _(Effect.forkScoped(run(
      input,
      Sink(
        (e) => done(Exit.failCause(e)),
        (a) => done(Exit.succeed(a))
      )
    )))

    return entry
  })
}

function makeDerivedFormEntry<R, E, I, O>(
  input: RefSubject.RefSubject<R, E, O>,
  options: FormEntryOptions<I, O>
): Effect.Effect<R | Scope.Scope, never, FormEntry.Derived<R, E, I, O>> {
  const decode_ = Schema.decode(options.schema)

  return Effect.map(makeFxFormEntry(input, options), (entry) =>
    Object.assign(
      entry,
      {
        persist: input.updateEffect(() => Effect.flatMap(entry, decode_))
      } as const
    ) satisfies FormEntry.Derived<R, E, I, O>)
}

class FormEntryImpl<E, I, O> extends RefSubjectImpl<never, E | ParseError, I> implements FormEntry<E, I, O> {
  constructor(
    initial: Effect.Effect<never, E, I>,
    readonly name: PropertyKey,
    readonly schema: Schema.Schema<I, O>,
    readonly parseOptions?: ParseOptions
  ) {
    super(
      initial,
      schemaEquivalence.from(schema),
      Ref.unsafeMake(Option.none()),
      Effect.unsafeMakeSemaphore(1),
      makeHoldSubject()
    )
  }

  decoded = this.mapEffect((i) => Schema.decode(this.schema)(i, this.parseOptions))

  static formEntry<E, I, O>(
    initial: Effect.Effect<never, E | ParseError, I>,
    name: PropertyKey,
    schema: Schema.Schema<I, O>
  ): FormEntry<E, I, O> {
    return new FormEntryImpl(initial, name, schema, parseOptions) as any
  }
}
