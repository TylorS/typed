import { Password } from "@/model"
import { Username } from "@/model/User"
import type { User } from "@/model/User"
import { Schema } from "@effect/schema"
import * as Context from "@typed/context"
import type { Effect } from "effect/Effect"
import type { UserNotFoundError } from "."

export const LoginInput = Schema.struct({ username: Username, password: Password })
export type LoginInput = Schema.Schema.To<typeof LoginInput>

export type LoginError = UserNotFoundError

export const Login = Context.Fn<(input: LoginInput) => Effect<User, LoginError>>()((_) =>
  class Login extends _("auth/Login") {}
)

export type Login = Context.Fn.Identifier<typeof Login>
