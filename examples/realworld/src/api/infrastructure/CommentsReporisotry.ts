import type * as Context from "@typed/context"
import { Effect } from "effect"
import { CommentsRepository } from "../../application"

// eslint-disable-next-line require-yield
export const CommentsRespsitoryLayer = CommentsRepository.layer(Effect.gen(function*(_) {
  const fns: Context.Tagged.Service<typeof CommentsRepository> = {}

  return fns
}))
