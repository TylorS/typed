import * as Schema from "@realworld/lib/Schema"
import type { User } from "@realworld/model"
import { Email, Password } from "@realworld/model"
import type { Unauthorized, Unprocessable } from "@realworld/services/errors"
import { Fn } from "@typed/context"
import type { Effect } from "effect/Effect"

export const LoginInput = Schema.Struct({
  email: Email,
  password: Password
}).pipe(
  Schema.identifier("LoginInput")
)
export type LoginInput = Schema.Schema.Type<typeof LoginInput>

export type LoginError = Unauthorized | Unprocessable

export const Login = Fn<(input: LoginInput) => Effect<User, LoginError>>()("Login")
export type Login = Fn.Identifier<typeof Login>
