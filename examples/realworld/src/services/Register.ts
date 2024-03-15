import type { User } from "@/model"
import { Email, Password, Username } from "@/model"
import type { Unauthorized, Unprocessable } from "@/services/errors"
import { Fn } from "@typed/context"
import type { Effect } from "effect/Effect"
import * as Schema from "lib/Schema"

export const RegisterInput = Schema.struct({
  email: Email,
  username: Username,
  password: Password
}).pipe(Schema.identifier("RegisterInput"))
export type RegisterInput = Schema.Schema.Type<typeof RegisterInput>

export type RegisterError = Unauthorized | Unprocessable

export const Register = Fn<(input: RegisterInput) => Effect<User, RegisterError>>()("Register")
export type Register = Fn.Identifier<typeof Register>
