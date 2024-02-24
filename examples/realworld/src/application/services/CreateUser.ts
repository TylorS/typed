import * as Schema from "@effect/schema/Schema"
import * as Context from "@typed/context"
import type { Effect } from "effect/Effect"
import { Password } from "../../domain"
import { Email, Username } from "../../domain/User"
import type { User } from "../../domain/User"
import type { ExistingEmailError } from "./errors"

export const CreateUserInput = Schema.struct({
  email: Email,
  username: Username,
  password: Password
})
export type CreateUserInput = Schema.Schema.To<typeof CreateUserInput>

export const CreateUser = Context.Fn<
  (input: CreateUserInput) => Effect<User, ExistingEmailError>
>()((_) => class CreateUser extends _("auth/CreateUser") {})

export type CreateUser = Context.Fn.Identifier<typeof CreateUser>
