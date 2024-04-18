import * as Schema from "lib/Schema"
import { User } from "./User"

export const Profile = User.pipe(
  Schema.omit("id", "token"),
  Schema.extend(Schema.Struct({ following: Schema.Boolean })),
  Schema.identifier("Profile")
)

export interface Profile extends Schema.Schema.Type<typeof Profile> {}
