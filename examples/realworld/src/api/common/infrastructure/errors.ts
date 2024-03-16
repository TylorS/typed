import type { Unauthorized } from "@/services/errors"
import { Unprocessable } from "@/services/errors"
import { TreeFormatter } from "@effect/schema"
import type { ParseError } from "@effect/schema/ParseResult"
import type { SchemaError, SqlError } from "@sqlfx/sql/Error"
import { type ConfigError, Effect } from "effect"

export type ExpectedErrors = SqlError | ParseError | SchemaError | ConfigError.ConfigError

export const catchExpectedErrors = <A, E extends Unauthorized | Unprocessable, R>(
  effect: Effect.Effect<A, E | ExpectedErrors, R>
): Effect.Effect<A, Exclude<E, ExpectedErrors>, R> =>
  Effect.catchAll(effect, (e) => Effect.fail(handleExpectedErrors(e)))

export function handleExpectedErrors<
  T extends Unauthorized | Unprocessable | ExpectedErrors
>(
  error: T
): Exclude<T, ExpectedErrors> {
  switch (error._tag) {
    case "Unauthorized":
      return error as Exclude<T, ExpectedErrors>
    case "Unprocessable":
      return error as Exclude<T, ExpectedErrors>
    case "SqlError":
      return new Unprocessable({ errors: [error.message] }) as Exclude<T, ExpectedErrors>
    case "ParseError":
    case "SchemaError":
      return new Unprocessable({ errors: [TreeFormatter.formatIssue(error.error)] }) as Exclude<T, ExpectedErrors>
    default: // ConfigError
      return new Unprocessable({ errors: [error.toString()] }) as Exclude<T, ExpectedErrors>
  }
}
