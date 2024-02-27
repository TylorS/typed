import * as Schema from "@effect/schema/Schema"
import { User } from "./User"

export const Profile = User.pipe(
  Schema.omit("token"),
  Schema.extend(Schema.struct({ following: Schema.boolean }))
)
export type Profile = Schema.Schema.To<typeof Profile>

export function userToProfile(user: User, following: boolean): Profile {
  return {
    email: user.email,
    username: user.username,
    bio: user.bio,
    image: user.image,
    following
  }
}
