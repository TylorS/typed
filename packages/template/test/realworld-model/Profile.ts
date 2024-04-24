import * as Schema from "@effect/schema/Schema"
import { User } from "./User.js"

export const Profile = User.pipe(
  Schema.omit("id", "token"),
  Schema.extend(Schema.Struct({ following: Schema.Boolean })),
  Schema.identifier("Profile")
)

export interface Profile extends Schema.Schema.Type<typeof Profile> {}
