import { Layer } from "effect"
import { CurrentUserLive } from "./CurrentUserLive"
import { UsersRepoLive } from "./UsersLive"

export const UsersLive = Layer.provideMerge(
  CurrentUserLive,
  UsersRepoLive
)
