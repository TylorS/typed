import type { User } from "@/domain"
import { Password, Username } from "@/domain"
import * as Schema from "@/lib/Schema"
import { Fn } from "@typed/context"
import type { Effect } from "effect/Effect"

export const LoginInput = Schema.struct({
  username: Username,
  password: Password
})
export type LoginInput = Schema.Schema.To<typeof LoginInput>

export const Login = Fn<(input: LoginInput) => Effect<User>>()("Login")
export type Login = Fn.Identifier<typeof Login>
