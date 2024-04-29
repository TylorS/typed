import { Schema } from "@effect/schema"
import { Option, type Record } from "effect"

export * as ParseResult from "@effect/schema/ParseResult"
export * from "@effect/schema/Schema"
export * from "@typed/id/Schema"

export const optionalOrNull = <A, I, R>(
  schema: Schema.Schema<A, I, R>
): Schema.PropertySignature<":", Option.Option<A>, never, "?:", I | null | undefined, R> =>
  Schema.optionalToRequired(
    Schema.NullishOr(schema),
    Schema.OptionFromSelf(Schema.typeSchema(schema)),
    {
      decode: (o) => Option.flatMapNullable(o, (_) => _),
      encode: (a) => a
    }
  )

export const parseFormData = <Fields extends Record.ReadonlyRecord<string, Schema.Schema.Any>>(
  fields: Fields
) => {
  const keys = Object.keys(fields)
  const decode = Schema.decodeUnknown(Schema.Struct(fields))

  return (data: FormData) => decode(Object.fromEntries(keys.map((k) => [k, data.get(k)])))
}
