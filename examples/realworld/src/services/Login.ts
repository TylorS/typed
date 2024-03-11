import type { User } from "@/model"
import { Password, Username } from "@/model"
import { Fn } from "@typed/context"
import type { Effect } from "effect/Effect"
import * as Schema from "lib/Schema"

export const LoginInput = Schema.struct({
  username: Username,
  password: Password
})
export type LoginInput = Schema.Schema.To<typeof LoginInput>

export const Login = Fn<(input: LoginInput) => Effect<User>>()("Login")
export type Login = Fn.Identifier<typeof Login>
