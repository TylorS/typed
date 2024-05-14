import { AST, Schema } from "@effect/schema"
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

export const getFields = <A, I extends Record<keyof A, any>, R>(schema: Schema.Schema<A, I, R>): {
  readonly [K in keyof A]: Schema.Schema<A[K], I[K], R>
} =>
  Object.fromEntries(
    AST.getPropertySignatures(schema.ast).map((ps) => {
      if (ps.isOptional) {
        return [ps.name, Schema.NullishOr(Schema.make(ps.type))] as const
      }

      return [ps.name, Schema.make(ps.type)] as const
    })
  ) as any
