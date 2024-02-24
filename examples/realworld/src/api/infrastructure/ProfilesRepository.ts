import type * as Context from "@typed/context"
import { Effect } from "effect"
import { ProfilesRepository } from "../../application"

// eslint-disable-next-line require-yield
export const ProfilesRespsitoryLayer = ProfilesRepository.layer(Effect.gen(function*(_) {
  const fns: Context.Tagged.Service<typeof ProfilesRepository> = {}

  return fns
}))
