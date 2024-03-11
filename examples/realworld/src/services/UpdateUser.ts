import { User } from "@/model"
import { Fn } from "@typed/context"
import type { Effect } from "effect/Effect"
import * as Schema from "lib/Schema"

export const UpdateUserInput = User.pipe(Schema.omit("id"))
export type UpdateUserInput = Schema.Schema.To<typeof UpdateUserInput>

export const UpdateUser = Fn<(input: UpdateUserInput) => Effect<User>>()("UpdateUser")
export type UpdateUser = Fn.Identifier<typeof UpdateUser>
