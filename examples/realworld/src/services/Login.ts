import type { User } from "@/model"
import { Password, Username } from "@/model"
import type { Unauthorized, Unprocessable } from "@/services/errors"
import { Fn } from "@typed/context"
import type { Effect } from "effect/Effect"
import * as Schema from "lib/Schema"

export const LoginInput = Schema.struct({
  username: Username,
  password: Password
}).pipe(
  Schema.identifier("LoginInput")
)
export type LoginInput = Schema.Schema.Type<typeof LoginInput>

export type LoginError = Unauthorized | Unprocessable

export const Login = Fn<(input: LoginInput) => Effect<User, LoginError>>()("Login")
export type Login = Fn.Identifier<typeof Login>
