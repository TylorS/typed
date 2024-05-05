import { Fn } from "@typed/context"
import * as Schema from "@typed/realworld/lib/Schema"
import { Password, User } from "@typed/realworld/model"
import type { Unauthorized, Unprocessable } from "@typed/realworld/services/errors"
import type { Effect } from "effect/Effect"

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
