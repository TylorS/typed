import * as Schema from "lib/Schema"
import { User } from "./User"

export const Profile = Schema.suspend(() =>
  User.pipe(
    Schema.omit("id", "token"),
    Schema.extend(Schema.struct({ following: Schema.boolean })),
    Schema.identifier("Profile")
  )
)

export type Profile = Schema.Schema.Type<typeof Profile>
