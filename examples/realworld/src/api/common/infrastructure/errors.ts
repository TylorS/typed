import { Unprocessable } from "@/services/errors"
import { TreeFormatter } from "@effect/schema"
import type { ParseError } from "@effect/schema/ParseResult"
import type { SchemaError, SqlError } from "@sqlfx/sql/Error"
import { type ConfigError, Effect } from "effect"

export type ExpectedErrors = SqlError | ParseError | SchemaError | ConfigError.ConfigError

export const catchExpectedErrors = <A, E extends { readonly _tag: string }, R>(
  effect: Effect.Effect<A, E | ExpectedErrors, R>
): Effect.Effect<A, Exclude<E, ExpectedErrors> | Unprocessable, R> =>
  Effect.catchAll(effect, (e) => Effect.fail(handleExpectedErrors(e)))

export function handleExpectedErrors<
  T extends { readonly _tag: string }
>(
  error: T | ExpectedErrors
): Exclude<T, ExpectedErrors> | Unprocessable {
  switch (error._tag) {
    case "SqlError":
      return new Unprocessable({ errors: [(error as SqlError).message] })
    case "ParseError":
    case "SchemaError":
      return new Unprocessable({ errors: [TreeFormatter.formatIssue((error as SchemaError | ParseError).error)] })
    case "And":
    case "InvalidData":
    case "MissingData":
    case "Or":
    case "SourceUnavailable":
    case "Unsupported":
      return new Unprocessable({ errors: [error.toString()] })
    default:
      return error as Exclude<T, ExpectedErrors>
  }
}
