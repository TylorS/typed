import { Schema } from "@effect/schema"
import { EventHandler, Fx, html, many, RefArray, Route } from "@typed/core"
import { RefSubject } from "@typed/fx"
import { navigate } from "@typed/navigation"
import { getFields, parseFormData } from "@typed/realworld/lib/Schema"
import { ArticleTag, type ArticleTagList } from "@typed/realworld/model"
import { Articles, isAuthenticatedGuard } from "@typed/realworld/services"
import { CreateArticleInput } from "@typed/realworld/services/CreateArticle"
import { Effect } from "effect"

export const route = Route.literal("editor").pipe(isAuthenticatedGuard)

const parseCreateArticleInput = CreateArticleInput.pipe(
  Schema.omit("tagList"),
  getFields,
  parseFormData
)

export const main = Fx.gen(function*() {
  const tagInput = yield* RefSubject.of<string>("")
  const tagsList = yield* RefSubject.of<ArticleTagList>([])

  const onTagInput = EventHandler.target<HTMLInputElement>()((ev) => RefSubject.set(tagInput, ev.target.value))
  const onTagEnter = EventHandler.keys("Enter")((ev) => (ev.preventDefault(),
    Effect.gen(function*() {
      const tag = yield* RefSubject.get(tagInput)

      if (tag.trim() === "") return

      yield* RefSubject.set(tagInput, "")
      yield* RefArray.append(tagsList, ArticleTag(tag))
    }))
  )
  const errors = yield* RefSubject.of<ReadonlyArray<string>>([])
  const onSubmit = EventHandler.target<HTMLFormElement>()((ev) =>
    Effect.gen(function*() {
      const input = yield* parseCreateArticleInput(new FormData(ev.target))
      const article = yield* Articles.create({
        ...input,
        tagList: yield* tagsList
      })

      yield* navigate(`/article/${article.slug}`)
    }).pipe(
      Effect.catchTags({
        Unprocessable: (error) => RefSubject.set(errors, error.errors),
        Unauthorized: () => navigate("/login"),
        ParseError: (issue) => RefSubject.set(errors, [issue.message])
      })
    )
  )

  const removeTag = (tag: ArticleTag) => RefSubject.update(tagsList, (tags) => tags.filter((t) => t !== tag))

  return html`<div class="editor-page">
    <div class="container page">
      <div class="row">
        <div class="col-md-10 col-xs-12 offset-md-1">
          ${
    Fx.if(
      Fx.map(errors, (errors) => errors.length > 0),
      {
        onFalse: Fx.null,
        onTrue: html`<ul class="error-messages">
                ${
          many(
            errors,
            (e) => e,
            (error) => html`<li>${error}</li>`
          )
        }
              </ul>`
      }
    )
  }
          <form onsubmit=${onSubmit}>
            <fieldset>
              <fieldset class="form-group">
                <input
                  type="text"
                  class="form-control form-control-lg"
                  placeholder="Article Title"
                  name="title"
                />
              </fieldset>
              <fieldset class="form-group">
                <input
                  type="text"
                  class="form-control"
                  placeholder="What's this article about?"
                  name="description"
                />
              </fieldset>
              <fieldset class="form-group">
                <textarea
                  class="form-control"
                  rows="8"
                  placeholder="Write your article (in markdown)"
                  name="body"
                ></textarea>
              </fieldset>
              <fieldset class="form-group">
                <input
                  type="text"
                  class="form-control"
                  placeholder="Enter tags"
                  name="tagList"
                  .value=${tagInput}
                  onchange=${onTagInput}
                  oninput=${onTagInput}
                  onkeydown=${onTagEnter}
                />
                <div class="tag-list">
                  ${
    many(
      tagsList,
      (t) => t,
      (t) =>
        html` <span class="tag-default tag-pill">
                        <i
                          class="ion-close-round"
                          onclick=${Effect.flatMap(t, removeTag)}
                        ></i>
                        ${t}
                      </span>`
    )
  }
                </div>
              </fieldset>
              <button
                class="btn btn-lg pull-xs-right btn-primary"
              >
                Publish Article
              </button>
            </fieldset>
          </form>
        </div>
      </div>
    </div>
  </div>`
})
