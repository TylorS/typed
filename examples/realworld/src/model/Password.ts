import * as Schema from "@typed/realworld/lib/Schema"

export const Password = Schema.Secret.pipe(
  Schema.brand("Password"),
  Schema.identifier("Password"),
  Schema.description("Password")
)
export type Password = Schema.Schema.Type<typeof Password>

export const PasswordHash = Schema.Secret.pipe(
  Schema.brand("PasswordHash"),
  Schema.identifier("PasswordHash"),
  Schema.description("PasswordHash")
)
export type PasswordHash = Schema.Schema.Type<typeof PasswordHash>
