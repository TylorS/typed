import { UpdateUser, UpdateUserFailedError } from "@/services"
import { Clock, Effect, Option } from "effect"
import { makeJwtUser } from "./common/MakeJwt"
import { DbServices } from "./db/Db"

export const UpdateUserLive = UpdateUser.implement((input, token) =>
  Effect.gen(function*(_) {
    const Db = yield* _(DbServices)
    const timestamp = new Date(yield* _(Clock.currentTimeMillis))
    const dbUser = yield* _(Db.getUserByEmail(input.email), Effect.flatten)
    const updatedDbUser = yield* _(Db.updateUser({
      ...dbUser,
      bio: Option.some(input.bio),
      image: input.image,
      updated_at: timestamp
    }))

    return yield* _(makeJwtUser(Db, updatedDbUser, token))
  }).pipe(
    Effect.catchAll((e) =>
      Effect.gen(function*(_) {
        yield* _(Effect.logError(e))

        return yield* _(Effect.fail(new UpdateUserFailedError()))
      })
    )
  )
)
