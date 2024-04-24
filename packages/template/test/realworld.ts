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
import { renderToHtmlString, staticLayer } from "@typed/template/Html"
import { describe, it } from "@typed/template/Vitest"
import { Effect, Option } from "effect"
import { Article, ArticleTag } from "./realworld-model/Article"

describe("Realworld", () => {
  describe("Home Page", () => {
    const home = layout(homePage)

    it("renders to html", () =>
      Effect.gen(function*(_) {
        const html = yield* _(renderToHtmlString(home))
        expect(
          html
        ).toStrictEqual(
          "<nav class=\"navbar navbar-light\">" +
            "<div class=\"container\">" +
            "<a class=\"navbar-brand\" href=\"/\">conduit</a>" +
            "<ul class=\"nav navbar-nav pull-xs-right\">" +
            "<li class=\"nav-item\"><a class=\"nav-link active\" href=\"/\">Home</a></li>\n      " +
            "<li class=\"nav-item\"><a class=\"nav-link\" href=\"/login\">Sign in</a></li>\n      " +
            "<li class=\"nav-item\"><a class=\"nav-link\" href=\"/register\">Sign up</a></li></ul>" +
            "</div></nav>" +
            "<main>" +
            "<div class=\"home-page\">" +
            "<div class=\"banner\">" +
            "<div class=\"container\">" +
            "<h1 class=\"logo-font\">conduit</h1>" +
            "<p>A place to share your knowledge.</p>" +
            "</div></div>" +
            "<div class=\"container page\">" +
            "<div class=\"row\"><div class=\"col-md-9\"><div class=\"feed-toggle\">" +
            "<ul class=\"outline-active nav nav-pills\"><li class=\"nav-item\">" +
            "<li class=\"nav-item\"><a class=\"nav-link active\" href=\"/\">Global Feed</a></li>" +
            "</li></ul></div>" +
            "<div class=\"article-preview\"><div class=\"article-meta\"><a href=\"/profile/prope\"><img src=\"\"/></a><div class=\"info\"><a href=\"/profile/prope\" class=\"author\">prope</a><span class=\"date\">-271821-04-20T00:00:00.049Z</span></div><button class=\"btn btn-outline-primary btn-sm pull-xs-right\"><i class=\"ion-heart\"></i>1.6885469931889953e+21</button></div><a href=\"/article/length\" class=\"preview-link\"><h1>Q!</h1><p>lt#)H{r$3=</p><span>Read more...</span><ul class=\"tag-list\"><li class=\"tag-default tag-pill tag-outline\">Cl`<</li><li class=\"tag-default tag-pill tag-outline\">;H-x4J/6*</li><li class=\"tag-default tag-pill tag-outline\">J.s</li><li class=\"tag-default tag-pill tag-outline\"></li><li class=\"tag-default tag-pill tag-outline\">oJaB</li></ul></a></div>" +
            "<div class=\"article-preview\"><div class=\"article-meta\"><a href=\"/profile/b#9#$\"><img src=\"\"/></a><div class=\"info\"><a href=\"/profile/b#9#$\" class=\"author\">b#9#$</a><span class=\"date\">-143088-01-06T03:25:05.851Z</span></div><button class=\"btn btn-outline-primary btn-sm pull-xs-right\"><i class=\"ion-heart\"></i>-2.942726775082116e-44</button></div><a href=\"/article/__\" class=\"preview-link\"><h1>Zv?.Rf\\</h1><p>VG</p><span>Read more...</span><ul class=\"tag-list\"><li class=\"tag-default tag-pill tag-outline\"></li><li class=\"tag-default tag-pill tag-outline\">5j</li><li class=\"tag-default tag-pill tag-outline\">Z?!x</li><li class=\"tag-default tag-pill tag-outline\">=N=Dgpi&Z</li><li class=\"tag-default tag-pill tag-outline\">1ur</li><li class=\"tag-default tag-pill tag-outline\">P56bn,L@XN</li><li class=\"tag-default tag-pill tag-outline\">uqOQ</li><li class=\"tag-default tag-pill tag-outline\">C\\^|VZs</li><li class=\"tag-default tag-pill tag-outline\">8zM&O?q</li></ul></a></div>" +
            "<div class=\"article-preview\"><div class=\"article-meta\"><a href=\"/profile/^9\"><img src=\"\"/></a><div class=\"info\"><a href=\"/profile/^9\" class=\"author\">^9</a><span class=\"date\">+034589-02-08T22:53:21.758Z</span></div><button class=\"btn btn-outline-primary btn-sm pull-xs-right\"><i class=\"ion-heart\"></i>0.0007143478142097592</button></div><a href=\"/article/x\" class=\"preview-link\"><h1>p</h1><p>valueOf</p><span>Read more...</span><ul class=\"tag-list\"><li class=\"tag-default tag-pill tag-outline\"></li><li class=\"tag-default tag-pill tag-outline\">K</li><li class=\"tag-default tag-pill tag-outline\">x4!OHB </li><li class=\"tag-default tag-pill tag-outline\"><+</li><li class=\"tag-default tag-pill tag-outline\">5a</li><li class=\"tag-default tag-pill tag-outline\">=$Ax</li><li class=\"tag-default tag-pill tag-outline\">(weC]FePZ</li></ul></a></div>" +
            "<div class=\"article-preview\"><div class=\"article-meta\"><a href=\"/profile/#D%p+KdSU]\"><img src=\"\"/></a><div class=\"info\"><a href=\"/profile/#D%p+KdSU]\" class=\"author\">#D%p+KdSU]</a><span class=\"date\">1970-01-01T00:00:00.003Z</span></div><button class=\"btn btn-outline-primary btn-sm pull-xs-right\"><i class=\"ion-heart\"></i>-2.1019476964872256e-44</button></div><a href=\"/article/ref\" class=\"preview-link\"><h1>bind</h1><p>xj</p><span>Read more...</span><ul class=\"tag-list\"><li class=\"tag-default tag-pill tag-outline\">5</li><li class=\"tag-default tag-pill tag-outline\">vUF</li><li class=\"tag-default tag-pill tag-outline\">\"9yzbr# </li><li class=\"tag-default tag-pill tag-outline\">lle</li><li class=\"tag-default tag-pill tag-outline\">C</li><li class=\"tag-default tag-pill tag-outline\">!JO5niFR</li><li class=\"tag-default tag-pill tag-outline\">%\"!</li></ul></a></div>" +
            "<div class=\"article-preview\"><div class=\"article-meta\"><a href=\"/profile/n$1/2*Az\"><img src=\"rt\"/></a><div class=\"info\"><a href=\"/profile/n$1/2*Az\" class=\"author\">n$1/2*Az</a><span class=\"date\">1969-12-31T23:59:59.969Z</span></div><button class=\"btn btn-outline-primary btn-sm pull-xs-right\"><i class=\"ion-heart\"></i>-3.4028212353202322e+38</button></div><a href=\"/article/vn[PIUjx<\" class=\"preview-link\"><h1>FMtP9),[e</h1><p>-F*-ev</p><span>Read more...</span><ul class=\"tag-list\"><li class=\"tag-default tag-pill tag-outline\">amenamet</li><li class=\"tag-default tag-pill tag-outline\"></li></ul></a></div>" +
            "<div class=\"article-preview\"><div class=\"article-meta\"><a href=\"/profile/T\"><img src=\"e\"/></a><div class=\"info\"><a href=\"/profile/T\" class=\"author\">T</a><span class=\"date\">+275760-09-12T23:59:59.973Z</span></div><button class=\"btn btn-outline-primary btn-sm pull-xs-right\"><i class=\"ion-heart\"></i>-2.529720859940671e-15</button></div><a href=\"/article/vF*+\" class=\"preview-link\"><h1>%%=p=p</h1><p></p><span>Read more...</span><ul class=\"tag-list\"><li class=\"tag-default tag-pill tag-outline\"></li><li class=\"tag-default tag-pill tag-outline\">72% </li><li class=\"tag-default tag-pill tag-outline\">2\\>9U</li><li class=\"tag-default tag-pill tag-outline\">a{s%</li><li class=\"tag-default tag-pill tag-outline\">mvG</li><li class=\"tag-default tag-pill tag-outline\">5</li><li class=\"tag-default tag-pill tag-outline\">gX</li></ul></a></div>" +
            "<div class=\"article-preview\"><div class=\"article-meta\"><a href=\"/profile/l`@fUN\"><img src=\"\"/></a><div class=\"info\"><a href=\"/profile/l`@fUN\" class=\"author\">l`@fUN</a><span class=\"date\">1969-12-31T23:59:59.953Z</span></div><button class=\"btn btn-outline-primary btn-sm pull-xs-right\"><i class=\"ion-heart\"></i>5.895504173736299e-8</button></div><a href=\"/article/uqmZ\" class=\"preview-link\"><h1>xgV%j&N~!%</h1><p>rotyp</p><span>Read more...</span><ul class=\"tag-list\"><li class=\"tag-default tag-pill tag-outline\">@Wi@3\"f]=</li><li class=\"tag-default tag-pill tag-outline\">:I52o_%h</li><li class=\"tag-default tag-pill tag-outline\">k@01-</li><li class=\"tag-default tag-pill tag-outline\">-</li></ul></a></div>" +
            "<div class=\"article-preview\"><div class=\"article-meta\"><a href=\"/profile/MC\"><img src=\" #& %y~]\"/></a><div class=\"info\"><a href=\"/profile/MC\" class=\"author\">MC</a><span class=\"date\">-007059-12-08T15:07:16.394Z</span></div><button class=\"btn btn-outline-primary btn-sm pull-xs-right\"><i class=\"ion-heart\"></i>44804396</button></div><a href=\"/article/Kuzj\\Qm>s\" class=\"preview-link\"><h1>v3I6pm</h1><p>key</p><span>Read more...</span><ul class=\"tag-list\"><li class=\"tag-default tag-pill tag-outline\">=6oK=Q-nJ</li><li class=\"tag-default tag-pill tag-outline\">K0></li><li class=\"tag-default tag-pill tag-outline\">]w12U(Jm</li><li class=\"tag-default tag-pill tag-outline\">hWJwe@.</li><li class=\"tag-default tag-pill tag-outline\">02dl5\\G</li></ul></a></div>" +
            "<div class=\"article-preview\"><div class=\"article-meta\"><a href=\"/profile/~r\"><img src=\"apply\"/></a><div class=\"info\"><a href=\"/profile/~r\" class=\"author\">~r</a><span class=\"date\">+275760-09-12T23:59:59.960Z</span></div><button class=\"btn btn-outline-primary btn-sm pull-xs-right\"><i class=\"ion-heart\"></i>2.5223372357846707e-44</button></div><a href=\"/article/T=zO<\" class=\"preview-link\"><h1>ek]r&</h1><p>2sN3</p><span>Read more...</span><ul class=\"tag-list\"><li class=\"tag-default tag-pill tag-outline\">I@3Ctq7kK)</li><li class=\"tag-default tag-pill tag-outline\"></li><li class=\"tag-default tag-pill tag-outline\">`</li><li class=\"tag-default tag-pill tag-outline\">41.~pRh</li><li class=\"tag-default tag-pill tag-outline\">_g7/gPoRkk</li><li class=\"tag-default tag-pill tag-outline\"></li><li class=\"tag-default tag-pill tag-outline\">)Z'EJwL~4></li><li class=\"tag-default tag-pill tag-outline\">en=/{</li><li class=\"tag-default tag-pill tag-outline\">G</li></ul></a></div>" +
            "<div class=\"article-preview\"><div class=\"article-meta\"><a href=\"/profile//4]\"><img src=\"\"/></a><div class=\"info\"><a href=\"/profile//4]\" class=\"author\">/4]</a><span class=\"date\">+257797-11-13T03:32:03.664Z</span></div><button class=\"btn btn-outline-primary btn-sm pull-xs-right\"><i class=\"ion-heart\"></i>6.948888659394047e-22</button></div><a href=\"/article/^.>5]ei#\" class=\"preview-link\"><h1>3]mcX>(r</h1><p>MQ@!3+U,;</p><span>Read more...</span><ul class=\"tag-list\"><li class=\"tag-default tag-pill tag-outline\">PZZaaN</li><li class=\"tag-default tag-pill tag-outline\">9btTEqe</li><li class=\"tag-default tag-pill tag-outline\"></li><li class=\"tag-default tag-pill tag-outline\">hY</li><li class=\"tag-default tag-pill tag-outline\"></li><li class=\"tag-default tag-pill tag-outline\">&6,p</li><li class=\"tag-default tag-pill tag-outline\">(,*<U</li><li class=\"tag-default tag-pill tag-outline\">XU</li><li class=\"tag-default tag-pill tag-outline\">2X#h</li></ul></a></div>" +
            "<ul class=\"pagination\">" +
            "<li class=\"page-item active\"><a class=\"page-link\">1</a></li>" +
            "<li class=\"page-item\"><a class=\"page-link\">2</a></li></ul>" +
            "</div>" +
            "<div class=\"col-md-3\"><div class=\"sidebar\"><p>Popular Tags</p><div class=\"tag-list\"><a href=\"/?tag=TVb~o\"nP\" class=\"tag-pill tag-default\">TVb~o\"nP</a><!--manyTVb~o\"nP--><a href=\"/?tag=ref\" class=\"tag-pill tag-default\">ref</a><!--manyref--><a href=\"/?tag=\" class=\"tag-pill tag-default\"></a><!--many--><a href=\"/?tag=k\" class=\"tag-pill tag-default\">k</a><!--manyk--><a href=\"/?tag=2vn\" class=\"tag-pill tag-default\">2vn</a><!--many2vn--><a href=\"/?tag=yvF*+s)%%=\" class=\"tag-pill tag-default\">yvF*+s)%%=</a><!--manyyvF*+s)%%=--><a href=\"/?tag=m6Rc\" class=\"tag-pill tag-default\">m6Rc</a><!--manym6Rc--><a href=\"/?tag=__proto__\" class=\"tag-pill tag-default\">__proto__</a><!--many__proto__--><a href=\"/?tag=apply\" class=\"tag-pill tag-default\">apply</a><!--manyapply--><a href=\"/?tag=j^.>5]ei#5\" class=\"tag-pill tag-default\">j^.>5]ei#5</a><!--manyj^.>5]ei#5--></div></div></div></div></div></div></main>" +
            "<footer><div class=\"container\"><a href=\"/\" class=\"logo-font\">conduit</a><span class=\"attribution\">An interactive learning project from<a href=\"https://thinkster.io\">Thinkster</a>. Code & design licensed under MIT.</span></div></footer>"
        )
      }).pipe(
        Effect.provide(staticLayer),
        Effect.provide(Navigation.initialMemory({ url: "/" })),
        Router.withCurrentRoute(Route.home)
      ))
  })
})

const articleArbitrary = Arbitrary.make(Article)
const articles: ReadonlyArray<Article> = FastCheck.sample(articleArbitrary, { numRuns: 10, seed: 1 })

const tagArbitrary = Arbitrary.make(ArticleTag)
const tags: ReadonlyArray<ArticleTag> = FastCheck.sample(tagArbitrary, { numRuns: 10, seed: 1 })

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
            <li class="nav-item">
              ${NavLink("Global Feed", Route.home)}
            </li>
          </ul>
        </div>

        ${articles.map(ArticlePreview)}

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
            <a href="${userProfileHref}" onclick=${onclickProfile}><img src="${userProfileImage}" /></a>
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
