import * as Schema from "@/lib/Schema"

export const User = Schema.suspend(() =>
  Schema.struct({
    id: UserId,
    email: Email,
    username: Username,
    token: JwtToken,
    bio: Schema.optionalOrNull(Bio),
    image: Schema.optionalOrNull(Image)
  })
).pipe(Schema.identifier("User"))

export type User = Schema.Schema.To<typeof User>

export const UserId = Schema.nanoId.pipe(Schema.brand("UserId"))
export type UserId = Schema.Schema.To<typeof UserId>

export const Email = Schema.string.pipe(Schema.brand("Email"))
export type Email = Schema.Schema.To<typeof Email>

export const Username = Schema.string.pipe(Schema.brand("Username"))
export type Username = Schema.Schema.To<typeof Username>

export const Bio = Schema.string.pipe(Schema.brand("Bio"))
export type Bio = Schema.Schema.To<typeof Bio>

export const Image = Schema.string.pipe(Schema.brand("Image"))
export type Image = Schema.Schema.To<typeof Image>

export const JwtToken = Schema.string.pipe(Schema.brand("JwtToken"))
export type JwtToken = Schema.Schema.To<typeof JwtToken>
