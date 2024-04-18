import { Schema } from "@effect/schema"
import type { Option, Record } from "effect"

export * as ParseResult from "@effect/schema/ParseResult"
export * from "@effect/schema/Schema"
export * from "@typed/id/Schema"

export const optionalOrNull = <A, I, R>(
  schema: Schema.Schema<A, I, R>
): Schema.PropertySignature<":", Option.Option<A>, never, "?:", I | null, R> =>
  Schema.optional(schema, { nullable: true, exact: true, as: "Option" })

export const parseFormData = <Fields extends Record.ReadonlyRecord<string, Schema.Schema.Any>>(
  fields: Fields
) => {
  const keys = Object.keys(fields)
  const decode = Schema.decodeUnknown(Schema.Struct(fields))

  return (data: FormData) => decode(Object.fromEntries(keys.map((k) => [k, data.get(k)])))
}
