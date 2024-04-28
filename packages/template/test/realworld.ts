import { Arbitrary } from "@effect/schema"
import * as FastCheck from "@effect/schema/FastCheck"
import * as Fx from "@typed/fx"
import * as RefSubject from "@typed/fx/RefSubject"
import * as Navigation from "@typed/navigation"
import * as Route from "@typed/route"
import type { MatchInput } from "@typed/router"
import * as Router from "@typed/router"
import type { Placeholder, RenderEvent } from "@typed/template"
import { EventHandler, html, many } from "@typed/template"
import { renderToHtmlString, serverLayer } from "@typed/template/Html"
import {
  findHydrationHole,
  findHydrationTemplate,
  getHydrationRoot
} from "@typed/template/internal/v2/hydration-template"
import { getOrMakeWindow, testHydrate } from "@typed/template/Test"
import { describe, it } from "@typed/template/Vitest"
import { isArray } from "@typed/wire"
import { deepStrictEqual, ok } from "assert"
import { Effect, Option } from "effect"
import { Article, ArticleTag } from "./realworld-model/Article"

describe("Realworld", () => {
  describe("Home Page", () => {
    const home = layout(homePage)

    it("generates correct hydration root", () =>
      Effect.gen(function*(_) {
        const html = yield* _(renderToHtmlString(home))
        const { document } = yield* _(getOrMakeWindow())

        document.body.innerHTML = html

        const ROOT_TEMPLATE_HASH = "QIuT+JcysA0="

        console.time("getHydrationRoot")
        const root = getHydrationRoot(document.body)
        console.timeEnd("getHydrationRoot")

        ok(root._tag === "element")
        deepStrictEqual(root.parentNode, document.body)

        deepStrictEqual(root.childNodes.length, 1)
        const [template] = root.childNodes

        ok(template._tag === "template")
        deepStrictEqual(template.hash, ROOT_TEMPLATE_HASH)

        deepStrictEqual(template.childNodes.length, 3)

        const [header, main, footer] = template.childNodes

        ok(header._tag === "hole")
        ok(main._tag === "element")
        ok(footer._tag === "hole")

        deepStrictEqual(header.index, 0)
        deepStrictEqual(footer.index, 2)

        deepStrictEqual(main.childNodes.length, 1)
        const [homePageHole] = main.childNodes

        ok(homePageHole._tag === "hole")
        deepStrictEqual(homePageHole.index, 1)

        deepStrictEqual(findHydrationTemplate(root.childNodes, ROOT_TEMPLATE_HASH), template)
        deepStrictEqual(findHydrationHole(template.childNodes, 1), homePageHole)
      }).pipe(
        Effect.provide(serverLayer),
        Effect.provide(Navigation.initialMemory({ url: "/" })),
        Router.withCurrentRoute(Route.home)
      ))

    it("hydrates", () =>
      Effect.gen(function*(_) {
        const { elementRef, elements, window } = yield* _(
          testHydrate(home, (rendered) => rendered).pipe(
            Effect.provide(Navigation.initialMemory({ url: "/" })),
            Router.withCurrentRoute(Route.home)
          )
        )

        const rendered = yield* _(elementRef)

        ok(isArray(rendered))

        deepStrictEqual(rendered, elements)

        deepStrictEqual(rendered.length, 7)

        const [/*HOLE_START*/, header, /*HOLE_END*/, main, /*HOLE_START*/, footer /*HOLE_END*/] = rendered

        ok(header instanceof window.HTMLElement)
        deepStrictEqual(header.tagName, "NAV")

        ok(main instanceof window.HTMLElement)
        deepStrictEqual(main.tagName, "MAIN")

        ok(footer instanceof window.HTMLElement)
        deepStrictEqual(footer.tagName, "FOOTER")

        ok(main.firstElementChild instanceof window.HTMLElement)
        ok(main.firstElementChild.tagName === "DIV")
        ok(main.firstElementChild.className === "home-page")
      }))
  })
})

const articleArbitrary = Arbitrary.make(Article)
const articles: ReadonlyArray<Article> = FastCheck.sample(articleArbitrary, { numRuns: 10, seed: 1 })

const tagArbitrary = Arbitrary.make(ArticleTag)
const tags: ReadonlyArray<ArticleTag> = FastCheck.sample(tagArbitrary, { numRuns: 10, seed: 100 })

const homePage = html`<div class="home-page">
  <div class="banner">
    <div class="container">
      <h1 class="logo-font">conduit</h1>
      <p>A place to share your knowledge.</p>
    </div>
  </div>

  <div class="container page">
    <div class="row">
      <div class="col-md-9">
        <div class="feed-toggle">
          <ul class="outline-active nav nav-pills">
            ${NavLink("Global Feed", Route.home)}
          </ul>
        </div>

        ${many(Fx.succeed(articles), (a) => a.id, Fx.switchMap(ArticlePreview))}

        <ul class="pagination">
          <li class="page-item active">
            <a class="page-link" href="">1</a>
          </li>
          <li class="page-item">
            <a class="page-link" href="">2</a>
          </li>
        </ul>
      </div>

      <div class="col-md-3">
        <div class="sidebar">
          <p>Popular Tags</p>

          <div class="tag-list">
            ${
  many(
    Fx.succeed(tags),
    (t) => t,
    (t) => {
      const href = RefSubject.map(t, (t) => `/?tag=${t}`)
      const onclick = EventHandler.preventDefault(() => Effect.flatMap(href, Navigation.navigate))
      return html`<a href="${href}" class="tag-pill tag-default" onclick="${onclick}">${t}</a>`
    }
  ).pipe(
    Fx.switchMapCause(() => Fx.null)
  )
} 
          </div>
        </div>
      </div>
    </div>
  </div>
</div>`

function ArticlePreview(article: Article) {
  const userProfileHref = `/profile/${article.author.username}`
  const userProfileImage = Option.getOrElse(article.author.image, () => "")
  const userProfileName = article.author.username
  const createdDate = article.createdAt.toISOString()
  const favoritesCount = article.favoritesCount
  const tagList = article.tagList
  const title = article.title
  const description = article.description
  const onclickProfile = Navigation.navigate(userProfileHref)
  const articleHref = `/article/${article.slug}`
  const onclickArticle = Navigation.navigate(articleHref)

  return html`<div class="article-preview">
    <div class="article-meta">
      <a href="${userProfileHref}" onclick="${onclickProfile}"><img src="${userProfileImage}" /></a>
      <div class="info">
        <a href="${userProfileHref}" onclick=${onclickProfile} class="author">${userProfileName}</a>
        <span class="date">${createdDate}</span>
      </div>
      <button class="btn btn-outline-primary btn-sm pull-xs-right">
        <i class="ion-heart"></i> ${favoritesCount}
      </button>
    </div>
    <a href="${articleHref}" onclick=${onclickArticle} class="preview-link">
      <h1>${title}</h1>
      <p>${description}</p>
      <span>Read more...</span>
      <ul class="tag-list">
        ${tagList.map((t) => html`<li class="tag-default tag-pill tag-outline">${t}</li>`)}
      </ul>
    </a>
  </div>`
}

function NavLink<E, R, I extends MatchInput.Any>(
  content: Placeholder<string | RenderEvent, E, R>,
  input: I,
  ...params: Route.Route.ParamsList<MatchInput.Route<I>>
) {
  const { route } = Router.asRouteGuard(input)
  const to = route.interpolate(params[0] ?? {})
  const isActive = Router.isActive(route, ...params)
  const className = Fx.when(isActive, {
    onFalse: "nav-link",
    onTrue: "nav-link active"
  })

  return html`<li class="nav-item">
    <a
      onclick=${EventHandler.preventDefault(() => Navigation.navigate(to))} 
      class=${className}
      href=${to}
    >
      ${content}
    </a>
  </li>`
}

const Header = html`<nav class="navbar navbar-light">
  <div class="container">
    <a class="navbar-brand" href="/">conduit</a>
    <ul class="nav navbar-nav pull-xs-right">
      ${NavLink("Home", Route.home)}
      ${NavLink("Sign in", Route.literal("/login"))}
      ${NavLink("Sign up", Route.literal("/register"))}
    </ul>
  </div>
</nav>`

const Footer = html`<footer>
  <div class="container">
    <a href="/" class="logo-font">conduit</a>
    <span class="attribution">
      An interactive learning project from <a href="https://thinkster.io">Thinkster</a>. Code & design licensed under MIT.
    </span>
  </div>
</footer>`

function layout<E, R>(content: Fx.Fx<RenderEvent | null, E, R>) {
  return html`${Header}<main>${content}</main>${Footer}`
}
