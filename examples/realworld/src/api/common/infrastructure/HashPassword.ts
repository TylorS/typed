import type { Password } from "@/model"
import { PasswordHash } from "@/model"
import { Context } from "@typed/core"
import { Effect, Secret } from "effect"

export const HashPassword = Context.Fn<(password: Password) => Effect.Effect<PasswordHash>>()("PasswordHash")

export const HashPasswordLive = HashPassword.implement((password) =>
  Effect.gen(function*(_) {
    const bcrypt = yield* _(Effect.promise(() => import("bcrypt")))
    const hash = yield* _(Effect.promise(() => bcrypt.hash(Secret.value(password), 10)))
    return PasswordHash(Secret.fromString(hash))
  })
)
