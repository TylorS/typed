import { html, Link, many, RefSubject } from "@typed/core"
import { CurrentPath, getCurrentPathFromUrl } from "@typed/navigation"
import { CurrentSearchParams } from "@typed/router"

export function usePagination<E, R>(pageSize: number, count: RefSubject.Computed<number, E, R>) {
  const currentPage = RefSubject.map(CurrentSearchParams, (params) => Number(params.page ?? 1))
  const pages = RefSubject.map(count, (count) => Array.from({ length: Math.ceil(count / pageSize) }, (_, i) => i + 1))
  const view = html`<ul class="pagination">
    ${many(pages, (p) => p, (page) => renderPagination(currentPage, page))}
  </ul>`

  return {
    view,
    currentPage
  } as const
}

function renderPagination<R>(
  currentPage: RefSubject.Computed<number, never, R>,
  page: RefSubject.Computed<number>
) {
  const activeClassName = RefSubject.tuple([currentPage, page]).pipe(
    RefSubject.map(([current, p]) => current === p ? "active" : "")
  )

  const to = RefSubject.map(RefSubject.tuple([CurrentPath, page]), ([path, page]) => {
    const url = new URL(path, "http://localhost")
    url.searchParams.set("page", page.toString())
    return getCurrentPathFromUrl(url)
  })

  return html`<li class="page-item ${activeClassName}">
    ${Link({ to, className: "page-link", relative: false }, page)}
  </li>`
}
