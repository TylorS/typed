import * as Pg from "@sqlfx/pg"
import type * as Context from "@typed/context"
import { GetRandomValues, makeNanoId } from "@typed/id"
import { Effect } from "effect"
import { CreateUser } from "../../application/services"

export const CreateUserPgLive = CreateUser.layer(Effect.gen(function*(_) {
  const sql = yield* _(Pg.tag)
  const getRandomValues = yield* _(GetRandomValues)
  const makeUserId = makeNanoId.pipe(
    Effect.provide(GetRandomValues.context(getRandomValues)),
    Effect.map(UserI)
  )

  const statement = sql.unsafe(``)

  const create: Context.Tagged.Service<typeof CreateUser> = (input) =>
    Effect.gen(function*(_) {
      const id = yield* _(makeNanoId)
    })

  return create
}))
