import { Fn } from "@typed/context"
import * as Schema from "@typed/realworld/lib/Schema"
import type { User } from "@typed/realworld/model"
import { Email, Password, Username } from "@typed/realworld/model"
import type { Unprocessable } from "@typed/realworld/services/errors"
import type { Effect } from "effect/Effect"

export const RegisterInput = Schema.Struct({
  email: Email,
  username: Username,
  password: Password
}).annotations({ identifier: "RegisterInput" })
export type RegisterInput = Schema.Schema.Type<typeof RegisterInput>

export type RegisterError = Unprocessable

export const Register = Fn<(input: RegisterInput) => Effect<User, RegisterError>>()("Register")
export type Register = Fn.Identifier<typeof Register>
