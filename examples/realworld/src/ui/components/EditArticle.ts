import type { ParseError } from "@effect/schema/ParseResult"
import { EventHandler, Fx, html, many, RefSubject, Router } from "@typed/core"
import type { NavigationError } from "@typed/navigation"
import {
  type Article,
  ArticleBody,
  ArticleDescription,
  ArticleTag,
  type ArticleTagList,
  ArticleTitle
} from "@typed/realworld/model"
import type { Unauthorized, Unprocessable } from "@typed/realworld/services/errors"
import * as Routes from "@typed/realworld/ui/common/routes"
import { Effect } from "effect"

export type EditArticleFields = Pick<
  Article,
  "title" | "description" | "body" | "tagList"
>

export function useEditArticle<R, R2>(
  initial: RefSubject.Computed<
    EditArticleFields,
    Unprocessable | Unauthorized | ParseError,
    R
  >,
  onSubmit: (
    updated: EditArticleFields
  ) => Effect.Effect<
    unknown,
    Unprocessable | Unauthorized | ParseError | NavigationError,
    R2
  >
) {
  return Effect.gen(function*(_) {
    const article = yield* _(RefSubject.make(initial))
    const tagInput = yield* RefSubject.of<string>("")
    const { body, description, tagList, title } = RefSubject.proxy(article)

    const errors = yield* RefSubject.of<ReadonlyArray<string>>([])
    const submit = EventHandler.target<HTMLFormElement>({ preventDefault: true })(() =>
      article.pipe(
        Effect.flatMap(onSubmit),
        Effect.catchTags({
          Unprocessable: (error) => RefSubject.set(errors, error.errors),
          Unauthorized: () => Router.navigate(Routes.login, { relative: false }),
          ParseError: (issue) => RefSubject.set(errors, [issue.message])
        })
      )
    )

    const setTagInput = (input: string) => RefSubject.set(tagInput, input)
    const tagEnter = EventHandler.keys("Enter")(
      () =>
        Effect.gen(function*(_) {
          const input = yield* tagInput
          if (input.trim() === "") return

          const tags = input.split(",").flatMap((tag) => {
            const trimmed = tag.trim()
            return trimmed === "" ? [] : [ArticleTag.make(trimmed)]
          })

          yield* RefSubject.set(tagInput, "")
          yield* RefSubject.update(article, (a) => ({ ...a, tagList: [...a.tagList, ...tags] }))
        }),
      {
        preventDefault: true
      }
    )

    return {
      body,
      setBody: (body: ArticleBody) => RefSubject.update(article, (a) => ({ ...a, body })),
      description,
      setDescription: (description: ArticleDescription) => RefSubject.update(article, (a) => ({ ...a, description })),
      tagInput,
      setTagInput,
      tagList,
      tagEnter,
      updateTagList: (f: (tagList: ArticleTagList) => ArticleTagList) =>
        RefSubject.update(article, (a) => ({ ...a, tagList: f(a.tagList) })),
      title,
      setTitle: (title: ArticleTitle) => RefSubject.update(article, (a) => ({ ...a, title })),
      submit,
      errors
    }
  })
}

export type EditArticleModelAndIntent<R, R2> = Effect.Effect.Success<
  ReturnType<typeof useEditArticle<R, R2>>
>

export function renderErrors<R, R2>({
  errors
}: Pick<EditArticleModelAndIntent<R, R2>, "errors">) {
  return Fx.if(
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

export function renderForm<R, R2>({
  body,
  description,
  setBody,
  setDescription,
  setTagInput,
  setTitle,
  submit,
  tagEnter,
  tagInput,
  tagList,
  title,
  updateTagList
}: EditArticleModelAndIntent<R, R2>) {
  const onArticleTitle = EventHandler.target<HTMLInputElement>()((ev) => setTitle(ArticleTitle.make(ev.target.value)))
  const onArticleDescription = EventHandler.target<HTMLInputElement>()((ev) =>
    setDescription(ArticleDescription.make(ev.target.value))
  )
  const onArticleBody = EventHandler.target<HTMLTextAreaElement>()((ev) => setBody(ArticleBody.make(ev.target.value)))
  const onTagInput = EventHandler.target<HTMLInputElement>()((ev) => setTagInput(ev.target.value))

  return html`<form onsubmit=${submit}>
    <fieldset>
      <fieldset class="form-group">
        <input
          type="text"
          class="form-control form-control-lg"
          placeholder="Article Title"
          name="title"
          .value=${title}
          onchange=${onArticleTitle}
          oninput=${onArticleTitle}
        />
      </fieldset>
      <fieldset class="form-group">
        <input
          type="text"
          class="form-control"
          placeholder="What's this article about?"
          name="description"
          .value=${description}
          onchange=${onArticleDescription}
          oninput=${onArticleDescription}
        />
      </fieldset>
      <fieldset class="form-group">
        <textarea
          class="form-control"
          rows="8"
          placeholder="Write your article (in markdown)"
          name="body"
          .value=${body}
          onchange=${onArticleBody}
          oninput=${onArticleBody}
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
          onkeydown=${tagEnter}
        />
        <div class="tag-list">
          ${
    many(
      tagList,
      (t) => t,
      (tag) =>
        html` <span class="tag-default tag-pill">
                <i
                  class="ion-close-round"
                  onclick=${Effect.flatMap(tag, (t) => updateTagList((tagList) => tagList.filter((tag) => tag !== t)))}
                ></i>
                ${tag}
              </span>`
    )
  }
        </div>
      </fieldset>
      <button class="btn btn-lg pull-xs-right btn-primary">
        Publish Article
      </button>
    </fieldset>
  </form>`
}

export function EditArticle<R, R2>(
  initial: RefSubject.Computed<
    EditArticleFields,
    Unprocessable | Unauthorized | ParseError,
    R
  >,
  onSubmit: (
    updated: EditArticleFields
  ) => Effect.Effect<
    unknown,
    Unprocessable | NavigationError | Unauthorized | ParseError,
    R2
  >
) {
  return Fx.gen(function*(_) {
    const model = yield* _(useEditArticle(initial, onSubmit))

    return html`<div class="editor-page">
      <div class="container page">
        <div class="row">
          <div class="col-md-10 col-xs-12 offset-md-1">
            ${renderErrors(model)} ${renderForm(model)}
          </div>
        </div>
      </div>
    </div>`
  })
}
