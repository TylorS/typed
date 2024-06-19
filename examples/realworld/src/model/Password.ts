import * as Schema from "@typed/realworld/lib/Schema"

export const Password = Schema.Redacted(Schema.String).pipe(
  Schema.brand("Password"),
  Schema.annotations({ identifier: "Password", description: "Password" })
)
export type Password = Schema.Schema.Type<typeof Password>

export const PasswordHash = Schema.Redacted(Schema.String).pipe(
  Schema.brand("PasswordHash"),
  Schema.annotations({ identifier: "PasswordHash", description: "PasswordHash" })
)
export type PasswordHash = Schema.Schema.Type<typeof PasswordHash>
