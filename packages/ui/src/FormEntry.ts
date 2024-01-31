import { ArrayFormatter, Schema } from "@effect/schema"
import type * as AST from "@effect/schema/AST"
import * as ParseResult from "@effect/schema/ParseResult"
import * as Fx from "@typed/fx/Fx"
import * as RefSubject from "@typed/fx/RefSubject"
import { ComputedTypeId, RefSubjectTypeId } from "@typed/fx/TypeId"
import * as Versioned from "@typed/fx/Versioned"
import { type Cause, Option } from "effect"
import * as Effect from "effect/Effect"
import { isNonEmptyReadonlyArray, type NonEmptyReadonlyArray } from "effect/ReadonlyArray"
import type * as Scope from "effect/Scope"

const parseOptions: AST.ParseOptions = {
  errors: "all",
  onExcessProperty: "ignore"
}

export interface FormEntry<R, E, I, O> extends RefSubject.RefSubject<R, E | ParseResult.ParseError, I> {
  readonly decoded: RefSubject.Computed<R, E | ParseResult.ParseError, O>
  readonly issue: RefSubject.Computed<R, never, Option.Option<ParseResult.ParseIssue>>
  readonly issues: RefSubject.Filtered<R, never, NonEmptyReadonlyArray<ArrayFormatter.Issue>>
  readonly message: RefSubject.Filtered<R, never, string>
}

export namespace FormEntry {
  export type Any =
    | FormEntry<any, any, any, any>
    | FormEntry<any, never, never, any>
    | FormEntry<any, never, any, any>
    | FormEntry<any, any, never, any>

  export type Context<T> = [T] extends [undefined] ? never :
    [T] extends [null] ? never :
    [T] extends [never] ? never
    : T extends FormEntry<infer R, infer _E, infer _I, infer _O> ? R
    : never

  export type Error<T> = [T] extends [undefined] ? never :
    [T] extends [null] ? never :
    [T] extends [never] ? never
    : T extends FormEntry<infer _R, infer E, infer _I, infer _O> ? E
    : never

  export type Input<T> = [T] extends [undefined] ? never :
    [T] extends [null] ? never :
    [T] extends [never] ? never
    : T extends FormEntry<infer _R, infer _E, infer I, infer _O> ? I
    : never

  export type Output<T> = [T] extends [undefined] ? never :
    [T] extends [null] ? never :
    [T] extends [never] ? never
    : T extends FormEntry<infer _R, infer _E, infer _I, infer O> ? O
    : never
}

export function make<R, E, I, O>(
  encoded: RefSubject.RefSubject<R, E | ParseResult.ParseError, I>,
  decoded: RefSubject.Computed<R, E | ParseResult.ParseError, O>,
  issue: RefSubject.Computed<R, never, Option.Option<ParseResult.ParseIssue>> = getParseIssue(decoded)
): FormEntry<R, E, I, O> {
  return new FormEntryImpl(
    encoded,
    decoded,
    issue
  )
}

function isParseError(e: unknown): e is ParseResult.ParseError {
  return e instanceof ParseResult.ParseError
}

function getParseIssue<R, E, O>(
  decoded: RefSubject.Computed<R, E | ParseResult.ParseError, O>
): RefSubject.Computed<R, never, Option.Option<ParseResult.ParseIssue>> {
  const fx = decoded.pipe(
    Fx.mapError((e) => isParseError(e) ? Option.some(e) : Option.none()),
    Fx.flip,
    Fx.filterMapError(() => Option.none()),
    Fx.prepend(Option.none<ParseResult.ParseError>())
  )
  const effect = decoded.pipe(
    Effect.match({
      onFailure: (e) => isParseError(e) ? Option.some(e) : Option.none(),
      onSuccess: () => Option.none()
    })
  )

  return RefSubject.map(
    Versioned.make(decoded.version, fx, effect),
    Option.map(({ error }: ParseResult.ParseError) => error)
  )
}

function fromSchema_<R, I, O, R2, E2>(
  schema: Schema.Schema<R, I, O>,
  value: Fx.Fx<R2, E2, O> | Effect.Effect<R2, E2, O>
): Effect.Effect<R | R2 | Scope.Scope, never, FormEntry<never, E2, I, O>> {
  return Effect.gen(function*(_) {
    const encoded = yield* _(RefSubject.make(mapInput(value, Schema.encode(schema, parseOptions))))
    const decoded = RefSubject.provide(
      RefSubject.mapEffect(encoded, Schema.decode(schema, parseOptions)),
      yield* _(Effect.context<R>())
    )

    return make(
      encoded,
      decoded
    )
  })
}

export const fromSchema: {
  <R, I, O>(schema: Schema.Schema<R, I, O>): <R2, E2>(
    value: Fx.Fx<R2, E2, O> | Effect.Effect<R2, E2, O>
  ) => Effect.Effect<Scope.Scope | R | R2, never, FormEntry<never, E2, I, O>>

  <R, I, O, R2, E2>(
    schema: Schema.Schema<R, I, O>,
    value: Fx.Fx<R2, E2, O> | Effect.Effect<R2, E2, O>
  ): Effect.Effect<Scope.Scope | R | R2, never, FormEntry<never, E2, I, O>>
} = function fromSchema<R, I, O, R2, E2>(
  ...args: [Schema.Schema<R, I, O>] | [Schema.Schema<R, I, O>, Fx.Fx<R2, E2, O> | Effect.Effect<R2, E2, O>]
): any {
  if (args.length === 1) {
    return (value: any) => fromSchema_(args[0], value)
  } else {
    return fromSchema_(args[0], args[1])
  }
}

function fromSchemaInput_<R, I, O, R2, E2>(
  schema: Schema.Schema<R, I, O>,
  value: Fx.Fx<R2, E2, I> | Effect.Effect<R2, E2, I>
): Effect.Effect<R | R2 | Scope.Scope, never, FormEntry<never, E2 | ParseResult.ParseError, I, O>> {
  return Effect.gen(function*(_) {
    const encoded = yield* _(RefSubject.make(value as Fx.Fx<R2, E2 | ParseResult.ParseError, I>))
    const decoded = RefSubject.provide(
      RefSubject.mapEffect(encoded, Schema.decode(schema, parseOptions)),
      yield* _(Effect.context<R>())
    )

    return make(
      encoded,
      decoded
    )
  })
}

export const fromSchemaInput: {
  <R, I, O>(schema: Schema.Schema<R, I, O>): <R2, E2>(
    value: Fx.Fx<R2, E2, I> | Effect.Effect<R2, E2, I>
  ) => Effect.Effect<Scope.Scope | R | R2, never, FormEntry<never, E2 | ParseResult.ParseError, I, O>>

  <R, I, O, R2, E2>(
    schema: Schema.Schema<R, I, O>,
    value: Fx.Fx<R2, E2, I> | Effect.Effect<R2, E2, I>
  ): Effect.Effect<Scope.Scope | R | R2, never, FormEntry<never, E2 | ParseResult.ParseError, I, O>>
} = function fromSchemaInput<R, I, O, R2, E2>(
  ...args: [Schema.Schema<R, I, O>] | [Schema.Schema<R, I, O>, Fx.Fx<R2, E2, I> | Effect.Effect<R2, E2, I>]
): any {
  if (args.length === 1) {
    return (value: any) => fromSchemaInput_(args[0], value)
  } else {
    return fromSchemaInput_(args[0], args[1])
  }
}

function mapInput<R, E, A, R2, E2, B>(
  input: Fx.Fx<R, E, A> | Effect.Effect<R, E, A>,
  f: (a: A) => Effect.Effect<R2, E2, B>
): Fx.Fx<R | R2, E | E2, B> | Effect.Effect<R | R2, E | E2, B> {
  if (Fx.isFx(input)) {
    return Fx.mapEffect(input, f)
  } else {
    return Effect.flatMap(input, f)
  }
}

function formatIssue(
  option: Option.Option<ParseResult.ParseIssue>
): Option.Option<NonEmptyReadonlyArray<ArrayFormatter.Issue>> {
  if (Option.isNone(option)) return Option.none()
  const issue = option.value
  const issues = ArrayFormatter.formatIssue(issue)
  if (isNonEmptyReadonlyArray(issues)) {
    return Option.some(issues)
  } else {
    return Option.none()
  }
}

class FormEntryImpl<R, E, I, O>
  extends Fx.FxEffectBase<R | Scope.Scope, E | ParseResult.ParseError, I, R, E | ParseResult.ParseError, I>
  implements FormEntry<R, E, I, O>
{
  readonly [RefSubjectTypeId]: RefSubjectTypeId = RefSubjectTypeId
  readonly [ComputedTypeId]: ComputedTypeId = ComputedTypeId

  readonly version: FormEntry<R, E, I, O>["version"]
  readonly subscriberCount: FormEntry<R, E, I, O>["subscriberCount"]
  readonly interrupt: FormEntry<R, E, I, O>["interrupt"]

  readonly issues: FormEntry<R, E, I, O>["issues"]
  readonly message: FormEntry<R, E, I, O>["message"]

  constructor(
    readonly encoded: RefSubject.RefSubject<R, E | ParseResult.ParseError, I>,
    readonly decoded: RefSubject.Computed<R, E | ParseResult.ParseError, O>,
    readonly issue: FormEntry<R, E, I, O>["issue"]
  ) {
    super()

    this.version = encoded.version
    this.subscriberCount = encoded.subscriberCount
    this.interrupt = encoded.interrupt
    this.issue = getParseIssue(decoded)
    this.issues = RefSubject.filterMap(this.issue, formatIssue)
    this.message = RefSubject.map(this.issues, (issues) => issues[0].message)
  }

  toFx(): Fx.Fx<R | Scope.Scope, E | ParseResult.ParseError, I> {
    return this.encoded
  }

  toEffect(): Effect.Effect<R, E | ParseResult.ParseError, I> {
    return this.encoded
  }

  runUpdates<R2, E2, B>(
    f: (ref: RefSubject.GetSetDelete<R, E | ParseResult.ParseError, I>) => Effect.Effect<R2, E2, B>
  ) {
    return this.encoded.runUpdates(f)
  }

  onFailure(cause: Cause.Cause<E>): Effect.Effect<R, never, void> {
    return this.encoded.onFailure(cause)
  }

  onSuccess(value: I): Effect.Effect<R, never, unknown> {
    return this.encoded.onSuccess(value)
  }
}
