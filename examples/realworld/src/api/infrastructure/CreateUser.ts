import { CreateUser, ExistingEmailError } from "@/services"
import { Clock, Effect, Option, Secret } from "effect"
import { makeJwtUser } from "./common/MakeJwt"
import { makePasswordHash } from "./common/makePasswordHash"
import { DbServices } from "./db/Db"

export const CreateUserLive = CreateUser.implement((input) =>
  Effect.gen(function*(_) {
    const Db = yield* _(DbServices)
    const timestamp = new Date(yield* _(Clock.currentTimeMillis))
    const dbUser = yield* _(Db.createUser({
      email: input.email,
      username: input.username,
      password: makePasswordHash(Secret.value(input.password)),
      bio: Option.none(),
      image: Option.none(),
      created_at: timestamp,
      updated_at: timestamp,
      deleted: false
    }))

    return yield* _(makeJwtUser(Db, dbUser))
  }).pipe(
    Effect.catchAll((e) =>
      Effect.gen(function*(_) {
        yield* _(Effect.logError(e))

        return yield* _(Effect.fail(new ExistingEmailError(input.email)))
      })
    )
  )
)
