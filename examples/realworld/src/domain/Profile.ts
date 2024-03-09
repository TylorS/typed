import * as Schema from "@/lib/Schema"
import { User } from "./User"

export const Profile = User.pipe(
  Schema.pick("email", "username", "bio", "image"),
  Schema.extend(Schema.struct({ following: Schema.boolean }))
)

export type Profile = Schema.Schema.To<typeof Profile>
