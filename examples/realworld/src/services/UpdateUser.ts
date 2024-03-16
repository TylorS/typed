import { Password, User } from "@/model"
import type { Unauthorized, Unprocessable } from "@/services/errors"
import { Fn } from "@typed/context"
import type { Effect } from "effect/Effect"
import * as Schema from "lib/Schema"

export const UpdateUserInput = Schema.struct({
  email: User.fields.email,
  username: Schema.optionFromNullable(User.fields.username),
  password: Schema.optionFromNullable(Password),
  image: User.fields.image,
  bio: User.fields.bio
})
export type UpdateUserInput = Schema.Schema.Type<typeof UpdateUserInput>

export type UpdateUserError = Unauthorized | Unprocessable

export const UpdateUser = Fn<(input: UpdateUserInput) => Effect<User, UpdateUserError>>()("UpdateUser")
export type UpdateUser = Fn.Identifier<typeof UpdateUser>
