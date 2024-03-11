import type { User } from "@/model"
import { Email, Password, Username } from "@/model"
import { Fn } from "@typed/context"
import type { Effect } from "effect/Effect"
import * as Schema from "lib/Schema"

export const RegisterInput = Schema.struct({
  email: Email,
  username: Username,
  password: Password
})
export type RegisterInput = Schema.Schema.To<typeof RegisterInput>

export const Register = Fn<(input: RegisterInput) => Effect<User>>()("Register")
export type Register = Fn.Identifier<typeof Register>
