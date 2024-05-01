import { Unprocessable } from "@/services/errors"
import { TreeFormatter } from "@effect/schema"
import type { ParseError } from "@effect/schema/ParseResult"
import type * as Pg from "@effect/sql-pg"
import { type ConfigError, Effect } from "effect"
import type { NoSuchElementException } from "effect/Cause"

export type ExpectedErrors = Pg.error.SqlError | ParseError | ConfigError.ConfigError | NoSuchElementException

export const catchExpectedErrors = <A, E extends { readonly _tag: string }, R>(
  effect: Effect.Effect<A, E | ExpectedErrors, R>
): Effect.Effect<A, Exclude<E, ExpectedErrors> | Unprocessable, R> =>
  Effect.catchAll(effect, (e) => Effect.fail(handleExpectedErrors(e)))

export function handleExpectedErrors<
  T extends { readonly _tag: string }
>(
  error: T | ExpectedErrors
): Exclude<T, ExpectedErrors> | Unprocessable {
  console.log("error", error)
  switch (error._tag) {
    case "NoSuchElementException":
      return new Unprocessable({ errors: [(error as NoSuchElementException).message] })
    case "SqlError":
      return new Unprocessable({ errors: [(error as Pg.error.SqlError).message] })
    case "ParseError":
    case "SchemaError":
      return new Unprocessable({ errors: [TreeFormatter.formatIssueSync((error as ParseError).error)] })
    case "And":
    case "InvalidData":
    case "MissingData":
    case "Or":
    case "SourceUnavailable":
    case "Unsupported":
      return new Unprocessable({ errors: [`Server configuration error`] })
    default:
      return error as Exclude<T, ExpectedErrors>
  }
}
