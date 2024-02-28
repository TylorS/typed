import * as Schema from "@effect/schema/Schema"

export const Password = Schema.Secret.pipe(Schema.brand("Password"))
export type Password = Schema.Schema.To<typeof Password>
