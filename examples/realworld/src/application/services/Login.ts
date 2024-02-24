import { Schema } from "@effect/schema"
import * as Context from "@typed/context"
import type { Effect } from "effect/Effect"
import { Password } from "../../domain"
import { Username } from "../../domain/User"
import type { User } from "../../domain/User"

export const LoginInput = Schema.struct({ username: Username, password: Password })
export type LoginInput = Schema.Schema.To<typeof LoginInput>

export const Login = Context.Fn<(input: LoginInput) => Effect<User>>()((_) => class Login extends _("auth/Login") {})

export type Login = Context.Fn.Identifier<typeof Login>
