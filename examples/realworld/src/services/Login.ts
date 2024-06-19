import { Fn } from "@typed/context"
import * as Schema from "@typed/realworld/lib/Schema"
import type { User } from "@typed/realworld/model"
import { Email, Password } from "@typed/realworld/model"
import type { Unauthorized, Unprocessable } from "@typed/realworld/services/errors"
import type { Effect } from "effect/Effect"

export const LoginInput = Schema.Struct({
  email: Email,
  password: Password
}).annotations({ identifier: "LoginInput" })

export type LoginInput = Schema.Schema.Type<typeof LoginInput>

export type LoginError = Unauthorized | Unprocessable

export const Login = Fn<(input: LoginInput) => Effect<User, LoginError>>()("Login")
export type Login = Fn.Identifier<typeof Login>
