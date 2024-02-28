import * as Schema from "@effect/schema/Schema"

export const Email = Schema.string.pipe(Schema.brand("Email"))
export type Email = Schema.Schema.To<typeof Email>

export const JwtToken = Schema.Secret.pipe(Schema.brand("JwtToken"))
export type JwtToken = Schema.Schema.To<typeof JwtToken>

export const Username = Schema.string.pipe(Schema.brand("Username"))
export type Username = Schema.Schema.To<typeof Username>

export const Bio = Schema.string.pipe(Schema.brand("Bio"))
export type Bio = Schema.Schema.To<typeof Bio>

export const ImageUrl = Schema.string.pipe(Schema.brand("ImageUrl"))
export type ImageUrl = Schema.Schema.To<typeof ImageUrl>

export const User = Schema.struct({
  email: Email,
  token: JwtToken,
  username: Username,
  bio: Schema.optional(Bio, { exact: true, nullable: true, as: "Option" }),
  image: Schema.optional(ImageUrl, { exact: true, nullable: true, as: "Option" })
})

export type User = Schema.Schema.To<typeof User>
