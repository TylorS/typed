import { Layer } from "effect"
import { AddCommentLive } from "./AddComment"
import { CreateArticleLive } from "./CreateArticle"
import { CreateUserLive } from "./CreateUser"
import { DeleteArticleLive } from "./DeleteArticle"
import { DeleteCommentLive } from "./DeleteComment"
import { FavoriteArticleLive } from "./FavoriteArticle"
import { FollowUserLive } from "./FollowUser"
import { GetArticleLive } from "./GetArticle"
import { GetArticlesLive } from "./GetArticles"
import { GetCommentsLive } from "./GetComments"
import { GetCurrentUserLive } from "./GetCurrentUser"
import { GetFeedLive } from "./GetFeed"
import { GetProfileLive } from "./GetProfile"
import { GetTagsLive } from "./GetTags"
import { LoginLive } from "./Login"
import { UnfavoriteArticleLive } from "./UnfavoriteArticle"
import { UnfollowUserLive } from "./UnfollowUser"
import { UpdateArticleLive } from "./UpdateArticle"
import { UpdateUserLive } from "./UpdateUser"

export const ApiLive = Layer.mergeAll(
  AddCommentLive,
  CreateArticleLive,
  CreateUserLive,
  DeleteArticleLive,
  DeleteCommentLive,
  FavoriteArticleLive,
  FollowUserLive,
  GetArticleLive,
  GetArticlesLive,
  GetCommentsLive,
  GetCurrentUserLive,
  GetFeedLive,
  GetProfileLive,
  GetTagsLive,
  LoginLive,
  UnfavoriteArticleLive,
  UnfollowUserLive,
  UpdateArticleLive,
  UpdateUserLive
)
