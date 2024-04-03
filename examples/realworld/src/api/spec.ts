import { ArticlesSpec } from "@/api/articles"
import { CommentsSpec } from "@/api/comments"
import { ProfilesSpec } from "@/api/profiles"
import { TagsSpec } from "@/api/tags"
import { UsersSpec } from "@/api/users"
import { Api } from "@typed/server"

export const Spec = Api.make({
  title: "Realworld",
  servers: [`http://localhost:${import.meta.env.PROD ? "3000" : "5173"}/api`]
}).pipe(
  Api.addGroup(ArticlesSpec),
  Api.addGroup(CommentsSpec),
  Api.addGroup(ProfilesSpec),
  Api.addGroup(TagsSpec),
  Api.addGroup(UsersSpec)
)
