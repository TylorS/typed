import {
  add200,
  add201,
  addJwtTokenSecurity,
  addOptionalJwtTokenSecurity,
  addUnauthorizedResponse,
  addUnprocessableResponse
} from "@/api/common/spec"
import { Comment } from "@/model"
import { CreateCommentInput } from "@/services/CreateComment"
import { Api, ApiGroup } from "@typed/server"
import * as Schema from "lib/Schema"
import * as Routes from "./routes"

export const getComments = Api.get(
  "getComments",
  Routes.comments,
  { "description": "Get comments for an article. Auth not required." }
).pipe(
  add200(Schema.struct({ comments: Schema.array(Comment) })),
  addUnprocessableResponse,
  addOptionalJwtTokenSecurity
)

export const createComment = Api.post(
  "createComment",
  Routes.comments,
  { "description": "Create a comment. Auth is required" }
).pipe(
  Api.setRequestBody(Schema.struct({ comment: CreateCommentInput })),
  add201(Schema.struct({ comment: Comment })),
  addUnauthorizedResponse,
  addUnprocessableResponse,
  addJwtTokenSecurity
)

export const deleteComment = Api.delete(
  "deleteComment",
  Routes.comment,
  {
    description: "Delete a comment. Auth is required"
  }
).pipe(
  add200(),
  addUnauthorizedResponse,
  addUnprocessableResponse,
  addJwtTokenSecurity
)

export const CommentsSpec = ApiGroup.make("Comments").pipe(
  ApiGroup.addEndpoint(getComments),
  ApiGroup.addEndpoint(createComment),
  ApiGroup.addEndpoint(deleteComment)
)
