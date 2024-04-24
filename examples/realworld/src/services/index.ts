import { CreateComment } from "@/services/CreateComment"
import { DeleteArticle } from "@/services/DeleteArticle"
import { DeleteComment } from "@/services/DeleteComment"
import { FavoriteArticle } from "@/services/FavoriteArticle"
import { FollowProfile } from "@/services/FollowProfile"
import { GetArticle } from "@/services/GetArticle"
import { GetArticles } from "@/services/GetArticles"
import { GetComments } from "@/services/GetComments"
import { GetCurrentUser } from "@/services/GetCurrentUser"
import { GetFeed } from "@/services/GetFeed"
import { GetProfile } from "@/services/GetProfile"
import { GetTags } from "@/services/GetTags"
import { Login } from "@/services/Login"
import { Register } from "@/services/Register"
import { UnfavoriteArticle } from "@/services/UnfavoriteArticle"
import { UnfollowProfile } from "@/services/UnfollowProfile"
import { UpdateArticle } from "@/services/UpdateArticle"
import { UpdateUser } from "@/services/UpdateUser"
import { repository } from "@typed/context/Repository"
import { CreateArticle } from "./CreateArticle"

export const Articles = repository({
  list: GetArticles,
  feed: GetFeed,
  get: GetArticle,
  create: CreateArticle,
  update: UpdateArticle,
  delete: DeleteArticle,
  favorite: FavoriteArticle,
  unfavorite: UnfavoriteArticle
})

export const Comments = repository({
  get: GetComments,
  create: CreateComment,
  delete: DeleteComment
})

export const Profiles = repository({
  get: GetProfile,
  follow: FollowProfile,
  unfollow: UnfollowProfile
})

export const Tags = repository({ get: GetTags })

export const Users = repository({
  current: GetCurrentUser,
  login: Login,
  register: Register,
  update: UpdateUser
})

export * from "./CurrentUser"
