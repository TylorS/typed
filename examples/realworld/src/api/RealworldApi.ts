import { HttpApiBuilder, HttpApiSwagger } from "@typed/server"
import { Layer } from "effect"
import { ArticlesApi } from "./Articles.js"
import { CommentsApi } from "./Comments.js"
import { ProfilesApi } from "./Profiles.js"
import { Realworld } from "./Realworld.js"
import { TagsApi } from "./Tags.js"
import { UsersApi } from "./Users.js"

export const RealworldApi = HttpApiSwagger.layer().pipe(
  Layer.provideMerge(HttpApiBuilder.api(Realworld)),
  Layer.provide(ArticlesApi),
  Layer.provide(CommentsApi),
  Layer.provide(ProfilesApi),
  Layer.provide(TagsApi),
  Layer.provide(UsersApi)
)
