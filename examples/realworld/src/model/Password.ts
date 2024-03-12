import * as Schema from "lib/Schema"

export const Password = Schema.string.pipe(
  Schema.brand("Password"),
  Schema.identifier("Password"),
  Schema.description("Password")
)
export type Password = Schema.Schema.To<typeof Password>

export const PasswordHash = Schema.string.pipe(
  Schema.brand("PasswordHash"),
  Schema.identifier("PasswordHash"),
  Schema.description("PasswordHash")
)
export type PasswordHash = Schema.Schema.To<typeof PasswordHash>
