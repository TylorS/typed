import { Bio, Email, ImageUrl } from "@/model/User"
import type { JwtToken, User } from "@/model/User"
import * as Schema from "@effect/schema/Schema"
import * as Context from "@typed/context"
import type { Effect } from "effect/Effect"

export const UpdateUserInput = Schema.struct({
  email: Email,
  bio: Bio,
  image: Schema.optional(ImageUrl, { exact: true, nullable: true, as: "Option" })
})

export type UpdateUserInput = Schema.Schema.To<typeof UpdateUserInput>

export const UpdateUser = Context.Fn<(input: UpdateUserInput, token: JwtToken) => Effect<User>>()((_) =>
  class UpdateUser extends _("users/UpdateUser") {}
)

export type UpdateUser = Context.Fn.Identifier<typeof UpdateUser>
