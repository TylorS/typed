import { getRandomValues } from "@typed/id"
import { ArticlesLive } from "@typed/realworld/api/articles/infrastructure/ArticlesLive"
import { CommentsLive } from "@typed/realworld/api/comments/infrastructure/CommentsLive"
import { DbLive } from "@typed/realworld/api/common/infrastructure/db"
import { ProfilesLive } from "@typed/realworld/api/profiles/infrastructure/ProfilesLive"
import { TagsLive } from "@typed/realworld/api/tags/infrastructure/TagsLive"
import { UsersLive } from "@typed/realworld/api/users/infrastructure"
import { ConfigProvider, Layer } from "effect"
import { NodeSwaggerFiles } from "effect-http-node"

export const Live = Layer.mergeAll(ArticlesLive, CommentsLive, ProfilesLive, TagsLive, UsersLive).pipe(
  Layer.provideMerge(DbLive),
  Layer.provideMerge(getRandomValues),
  // You probably shouldn't use import.meta.env in a real application
  // as it will leak information into your bundle since Vite replaces these values at build time
  Layer.provide(Layer.setConfigProvider(ConfigProvider.fromJson(import.meta.env))),
  Layer.provideMerge(NodeSwaggerFiles.SwaggerFilesLive)
)

export { CurrentUserLive } from "@typed/realworld/api/users/infrastructure"
