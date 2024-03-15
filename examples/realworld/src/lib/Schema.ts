import { Schema } from "@effect/schema"
import type { Option } from "effect"

export * as ParseResult from "@effect/schema/ParseResult"
export * from "@effect/schema/Schema"
export * from "@typed/id/Schema"

export const optionalOrNull = <A, I, R>(
  schema: Schema.Schema<A, I, R>
): Schema.PropertySignature<":", Option.Option<A>, never, "?:", I | null, R> =>
  Schema.optional(schema, { nullable: true, exact: true, as: "Option" })
