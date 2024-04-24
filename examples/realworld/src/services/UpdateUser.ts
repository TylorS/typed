import { Password, User } from "@/model"
import type { Unauthorized, Unprocessable } from "@/services/errors"
import { Fn } from "@typed/context"
import type { Effect } from "effect/Effect"
import * as Schema from "@/lib/Schema"

export const UpdateUserInput = Schema.Struct({
  email: User.fields.email,
  username: Schema.OptionFromNullishOr(User.fields.username, null),
  password: Schema.OptionFromNullishOr(Password, null),
  image: User.fields.image,
  bio: User.fields.bio
}).pipe(Schema.identifier("UpdateUserInput"))
export type UpdateUserInput = Schema.Schema.Type<typeof UpdateUserInput>

export type UpdateUserError = Unauthorized | Unprocessable

export const UpdateUser = Fn<(input: UpdateUserInput) => Effect<User, UpdateUserError>>()("UpdateUser")
export type UpdateUser = Fn.Identifier<typeof UpdateUser>
