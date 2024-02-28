import * as Schema from "@effect/schema/Schema"

export const Password = Schema.string.pipe(Schema.brand("Password"))
export type Password = Schema.Schema.To<typeof Password>
