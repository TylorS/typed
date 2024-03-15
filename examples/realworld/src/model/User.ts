import * as Schema from "lib/Schema"

export const UserId = Schema.nanoId.pipe(Schema.brand("UserId"), Schema.description("Nano ID for User"))
export type UserId = Schema.Schema.Type<typeof UserId>

export const Email = Schema.string.pipe(Schema.brand("Email"), Schema.description("Email Address"))
export type Email = Schema.Schema.Type<typeof Email>

export const Username = Schema.string.pipe(Schema.brand("Username"), Schema.description("Username"))
export type Username = Schema.Schema.Type<typeof Username>

export const Bio = Schema.string.pipe(Schema.brand("Bio"), Schema.description("Biography"))
export type Bio = Schema.Schema.Type<typeof Bio>

export const Image = Schema.string.pipe(Schema.brand("Image"), Schema.description("Image URL"))
export type Image = Schema.Schema.Type<typeof Image>

export const JwtToken = Schema.string.pipe(Schema.brand("JwtToken"), Schema.description("JWT Token"))
export type JwtToken = Schema.Schema.Type<typeof JwtToken>

export const User = Schema.struct({
  id: UserId,
  email: Email,
  username: Username,
  token: JwtToken,
  bio: Schema.optionalOrNull(Bio),
  image: Schema.optionalOrNull(Image)
}).pipe(Schema.identifier("User"))

export type User = Schema.Schema.Type<typeof User>
