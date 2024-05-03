import { hydrateFromWindow } from "@typed/core"
import { Storage } from "@typed/dom/Storage"
import { Layer } from "effect"
import { ArticlesLive } from "./Articles"
import { CommentsLive } from "./Comments"
import * as CurrentUser from "./CurrentUser"
import { ProfilesLive } from "./Profiles"
import { TagsLive } from "./Tags"
import { UsersLive } from "./Users"

export const Live = Layer.mergeAll(ArticlesLive, CommentsLive, ProfilesLive, TagsLive, UsersLive).pipe(
  Layer.provideMerge(CurrentUser.Live),
  Layer.provideMerge(Storage.layer(localStorage)),
  Layer.provideMerge(hydrateFromWindow(window, { rootElement: document.getElementById("app")! }))
)
