import { html, Link, many, RefSubject } from "@typed/core"
import { CurrentSearchParams } from "@typed/router"

export function Pagination<E, R>(pageSize: number, count: RefSubject.Computed<number, E, R>) {
  const currentPage = RefSubject.map(CurrentSearchParams, (params) => Number(params.get("page") ?? 1))
  const pages = RefSubject.map(count, (count) => Array.from({ length: Math.ceil(count / pageSize) }, (_, i) => i + 1))

  return html`<ul class="pagination">
    ${many(pages, (p) => p, (page) => renderPagination(currentPage, page))}
  </ul>`
}

function renderPagination<R>(
  currentPage: RefSubject.Computed<number, never, R>,
  page: RefSubject.Computed<number>
) {
  const activeClassName = RefSubject.tuple([currentPage, page]).pipe(
    RefSubject.map(([current, p]) => current === p ? "active" : "")
  )

  return html`<li class="page-item ${activeClassName}">
    ${Link({ to: RefSubject.map(page, (p) => `?page=${p}`), className: "page-link" }, page)}
  </li>`
}
