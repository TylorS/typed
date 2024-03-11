import type { User } from "@/domain"
import { Email, Password, Username } from "@/domain"
import * as Schema from "@/lib/Schema"
import { Fn } from "@typed/context"
import type { Effect } from "effect/Effect"

export const RegisterInput = Schema.struct({
  email: Email,
  username: Username,
  password: Password
})
export type RegisterInput = Schema.Schema.To<typeof RegisterInput>

export const Register = Fn<(input: RegisterInput) => Effect<User>>()("Register")
export type Register = Fn.Identifier<typeof Register>
