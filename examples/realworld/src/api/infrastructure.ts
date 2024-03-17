import { ArticlesLive } from "@/api/articles/infrastructure/ArticlesLive"
import { CommentsLive } from "@/api/comments/infrastructure/CommentsLive"
import { DbLive } from "@/api/common/infrastructure/db"
import { ProfilesLive } from "@/api/profiles/infrastructure/ProfilesLive"
import { TagsLive } from "@/api/tags/infrastructure/TagsLive"
import { UsersLive } from "@/api/users/infrastructure/UsersLive"
import { getRandomValues } from "@typed/id"
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

export * from "./common/infrastructure/CurrentJwt"
