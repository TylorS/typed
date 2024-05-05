import { Context } from "@typed/core"
import type { Password } from "@typed/realworld/model"
import { PasswordHash } from "@typed/realworld/model"
import { Effect, Secret } from "effect"

export const HashPassword = Context.Fn<(password: Password) => Effect.Effect<PasswordHash>>()("PasswordHash")

export const HashPasswordLive = HashPassword.implement((password) =>
  Effect.gen(function*(_) {
    const bcrypt = yield* _(Effect.promise(() => import("bcrypt")))
    const hash = yield* _(Effect.promise(() => bcrypt.hash(Secret.value(password), 10)))
    return PasswordHash(Secret.fromString(hash))
  })
)

export const ComparePassword = Context.Fn<(password: Password, hash: PasswordHash) => Effect.Effect<boolean>>()(
  "ComparePassword"
)

export const ComparePasswordLive = ComparePassword.implement((password, hash) =>
  Effect.gen(function*(_) {
    const bcrypt = yield* _(Effect.promise(() => import("bcrypt")))
    return yield* _(Effect.promise(() => bcrypt.compare(Secret.value(password), Secret.value(hash))))
  })
)
