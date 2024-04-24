import * as Schema from "@effect/schema/Schema"
import { nanoId } from "@typed/id/Schema"

export const UserId = nanoId.pipe(Schema.brand("UserId"), Schema.description("Nano ID for User"))
export type UserId = Schema.Schema.Type<typeof UserId>

export const Email = Schema.String.pipe(Schema.brand("Email"), Schema.description("Email Address"))
export type Email = Schema.Schema.Type<typeof Email>

export const Username = Schema.String.pipe(Schema.brand("Username"), Schema.description("Username"))
export type Username = Schema.Schema.Type<typeof Username>

export const Bio = Schema.String.pipe(Schema.brand("Bio"), Schema.description("Biography"))
export type Bio = Schema.Schema.Type<typeof Bio>

export const Image = Schema.String.pipe(Schema.brand("Image"), Schema.description("Image URL"))
export type Image = Schema.Schema.Type<typeof Image>

export const JwtToken = Schema.String.pipe(Schema.brand("JwtToken"), Schema.description("JWT Token"))
export type JwtToken = Schema.Schema.Type<typeof JwtToken>

export const User = Schema.Struct({
  id: UserId,
  email: Email,
  username: Username,
  token: JwtToken,
  bio: Schema.OptionFromNullishOr(Bio, null),
  image: Schema.OptionFromNullishOr(Image, null)
}).pipe(Schema.identifier("User"))

export interface User extends Schema.Schema.Type<typeof User> {}
