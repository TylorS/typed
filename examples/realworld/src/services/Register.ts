import * as Schema from "@realworld/lib/Schema"
import type { User } from "@realworld/model"
import { Email, Password, Username } from "@realworld/model"
import type { Unprocessable } from "@realworld/services/errors"
import { Fn } from "@typed/context"
import type { Effect } from "effect/Effect"

export const RegisterInput = Schema.Struct({
  email: Email,
  username: Username,
  password: Password
}).pipe(Schema.identifier("RegisterInput"))
export type RegisterInput = Schema.Schema.Type<typeof RegisterInput>

export type RegisterError = Unprocessable

export const Register = Fn<(input: RegisterInput) => Effect<User, RegisterError>>()("Register")
export type Register = Fn.Identifier<typeof Register>
