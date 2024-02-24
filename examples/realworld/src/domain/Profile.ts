import * as Schema from "@effect/schema/Schema"
import type { User } from "./User"
import { Bio, ImageUrl, Username } from "./User"

export const Profile = Schema.struct({
  username: Username,
  bio: Schema.optional(Bio, { exact: true, nullable: true, as: "Option" }),
  image: Schema.optional(ImageUrl, { exact: true, nullable: true, as: "Option" }),
  following: Schema.boolean
})

export type Profile = Schema.Schema.To<typeof Profile>

export function userToProfile(user: User, following: boolean): Profile {
  return {
    username: user.username,
    bio: user.bio,
    image: user.image,
    following
  }
}
