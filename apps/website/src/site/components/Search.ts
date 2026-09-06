import { component } from "@typed/astro/Component";
import * as Fx from "@typed/fx/Fx";
import * as RefSubject from "@typed/fx/RefSubject";
import { EventHandler, html, makeEventSource, many } from "@typed/template";
import * as Button from "@typed/ui/Button";
import * as Dialog from "@typed/ui/Dialog";
import * as Effect from "effect/Effect";
import * as Schema from "effect/Schema";
import { searchDocumentation, type SearchArtifact, type SearchResult } from "../../docs/Search.js";
import { siteHref } from "../../SiteHref.js";

const Artifact = Schema.Struct({
  schemaVersion: Schema.Literal(1),
  entries: Schema.Array(
    Schema.Struct({
      id: Schema.String,
      title: Schema.String,
      kind: Schema.Literals(["package", "module", "exposure", "resource", "guide", "glossary"]),
      text: Schema.String,
      href: Schema.String,
      canonicalId: Schema.optional(Schema.String),
      declarationKey: Schema.optional(Schema.String),
      specifier: Schema.optional(Schema.String),
      description: Schema.optional(Schema.String),
      section: Schema.optional(Schema.String),
      topicId: Schema.optional(Schema.String),
      destination: Schema.optional(Schema.String),
    }),
  ),
  prefixes: Schema.Record(Schema.String, Schema.Array(Schema.Number)),
  trigrams: Schema.Record(Schema.String, Schema.Array(Schema.Number)),
});

interface Results {
  readonly message: string;
  readonly entries: ReadonlyArray<SearchResult>;
}

const kindLabel = (entry: SearchResult): string =>
  entry.kind === "guide" ? "Learn" : entry.kind === "glossary" ? "Definition" : "API";

const description = (entry: SearchResult): string =>
  (entry.description ?? "")
    .replace(/\[([^\]]+)\]\([^)]+\)/gu, "$1")
    .replace(/[`*_]/gu, "")
    .replace(/\s+/gu, " ")
    .trim();

const initialMessage = "Search by topic, API name, or import path.";

/** A native modal whose query subscription and requests belong to its Typed island Scope. */
export default component(function* () {
  const state = yield* Dialog.makeState();
  const query = yield* RefSubject.make("");
  const results = yield* RefSubject.make<Results>({
    message: initialMessage,
    entries: [],
  });
  const artifact = yield* RefSubject.make<SearchArtifact | undefined>(undefined);

  const search = Effect.fn(function* ([dialog, value]: readonly [Dialog.State, string]) {
    const term = value.trim();
    if (!dialog.open || !term) {
      yield* RefSubject.set(results, {
        message: initialMessage,
        entries: [],
      });
      return;
    }
    const cached = yield* artifact;
    if (cached === undefined)
      yield* RefSubject.set(results, { message: "Searching…", entries: [] });
    const loaded =
      cached === undefined
        ? yield* Effect.tryPromise({
            try: async (signal) => {
              const response = await fetch(siteHref("/search-index.json"), { signal });
              if (!response.ok) throw new Error(`Search index returned ${response.status}`);
              const data: unknown = await response.json();
              return Schema.decodeUnknownSync(Artifact)(data);
            },
            catch: () =>
              "Search is unavailable. Please try another query or try again later." as const,
          }).pipe(
            Effect.match({
              onFailure: (message) => ({ message, artifact: undefined }),
              onSuccess: (index) => ({ message: "", artifact: index }),
            }),
          )
        : { message: "", artifact: cached };
    if (loaded.artifact === undefined) {
      yield* RefSubject.set(results, { message: loaded.message, entries: [] });
      return;
    }
    yield* RefSubject.set(artifact, loaded.artifact);
    const entries = searchDocumentation(loaded.artifact, term, 12);
    yield* RefSubject.set(results, {
      message:
        entries.length === 0
          ? `No results for “${term}”.`
          : `${entries.length === 12 ? "Top " : ""}${entries.length} results`,
      entries,
    });
  });

  const attach = Effect.fn(function* (element: HTMLElement) {
    const document = element.ownerDocument;
    const keydown = EventHandler.make(
      Effect.fn(function* (event: KeyboardEvent) {
        if ((event.metaKey || event.ctrlKey) && !event.altKey && event.key.toLowerCase() === "k") {
          event.preventDefault();
          yield* Dialog.setOpen(state, true);
          return;
        }
        if (event.isComposing || event.altKey || event.metaKey || event.ctrlKey) return;
        if (!(yield* state).open) return;
        const input = element.querySelector<HTMLInputElement>("#docs-search-query");
        if (input === null) return;
        if (event.key === "Escape") {
          event.preventDefault();
          event.stopPropagation();
          if (yield* query) {
            yield* RefSubject.set(query, "");
            input.focus();
          } else yield* Dialog.close(state);
          return;
        }
        const links = [
          ...element.querySelectorAll<HTMLAnchorElement>(".search-results a, .search-start a"),
        ];
        const current = links.findIndex((link) => link === document.activeElement);
        if (event.key === "ArrowDown" && (document.activeElement === input || current >= 0)) {
          event.preventDefault();
          links[Math.min(current + 1, links.length - 1)]?.focus();
        } else if (event.key === "ArrowUp" && current >= 0) {
          event.preventDefault();
          (current === 0 ? input : links[current - 1])?.focus();
        } else if (event.key === "Enter" && document.activeElement === input) {
          const first = links[0];
          if (first !== undefined) {
            event.preventDefault();
            first.click();
          }
        } else if (current >= 0 && (event.key === "Home" || event.key === "End")) {
          event.preventDefault();
          links[event.key === "Home" ? 0 : links.length - 1]?.focus();
        }
      }),
    );
    const events = makeEventSource();
    events.addEventListener(
      document.documentElement,
      "keydown",
      keydown.pipe(EventHandler.catchCause(Effect.logError)),
    );
    yield* events.setup(document.documentElement, yield* Effect.scope);
    yield* Effect.forkScoped(Fx.drain(Fx.switchMapEffect(Fx.tuple(state, query), search)));
  });

  return html`<div ref=${attach}>
    ${Button.Button({
      content: html`<svg class="search-trigger__icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="10.5" cy="10.5" r="6.5" />
          <path d="m16 16 4.5 4.5" />
        </svg><span>Search docs</span><kbd>⌘ K</kbd>`,
      onclick: Dialog.setOpen(state, true),
      props: {
        class: "search-trigger btn btn-ghost",
          "aria-label": "Search docs",
        "aria-haspopup": "dialog",
        "aria-controls": "docs-search",
        "aria-expanded": RefSubject.map(state, ({ open }) => open),
      },
    })}
    ${Dialog.Content({
      state,
      id: "docs-search",
      labelledBy: "docs-search-title",
      props: { class: "search-dialog" },
      content: html`<div class="search-dialog-header">
          <h2 id="docs-search-title" class="sr-only">Search documentation</h2>
          <svg class="search-icon" viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="10.5" cy="10.5" r="6.5" />
            <path d="m16 16 5 5" />
          </svg>
          <label class="sr-only" for="docs-search-query">Search docs</label>
          <input
            id="docs-search-query"
            class="search-query"
            type="search"
            placeholder="Search docs…"
            aria-describedby="docs-search-help"
            autocomplete="off"
            spellcheck="false"
            maxlength="160"
            autofocus
            .value=${query}
            @input=${EventHandler.make((event: Event) => (event.currentTarget instanceof HTMLInputElement ? RefSubject.set(query, event.currentTarget.value) : Effect.void))}
          />
          ${Button.Button({ content: html`<span aria-hidden="true">×</span>`, onclick: Dialog.close(state), props: { class: "search-close btn btn-ghost btn-sm", "aria-label": "Close search" } })}
        </div>
        <div class="search-results">
          <p class="search-status" role="status" aria-live="polite">
            ${RefSubject.map(results, ({ message }) => message)}
          </p>
          ${Fx.switchMap(query, (value) =>
            value.trim()
              ? Fx.null
              : html`<nav class="search-start" aria-label="Start exploring">
                  <a href=${siteHref("/explore/quick-start")}
                    >Quick Start <span>Build your first counter</span></a
                  >
                  <a href=${siteHref("/explore/cooperative-by-design")}
                    >Cooperative by design <span>How the pieces fit together</span></a
                  >
                  <a href=${siteHref("/reference")}
                    >API reference <span>Browse packages and modules</span></a
                  >
                </nav>`,
          )}
          <ul class="search-result-list" aria-label="Search results">
            ${many(
              RefSubject.map(results, ({ entries }) => entries),
              (entry) => entry.id,
              (entry) => html`<li class="search-result">
                <a
                  class="search-result-link"
                  href=${RefSubject.map(entry, (value) => siteHref(value.href))}
                  @click=${Dialog.close(state)}
                >
                  <span class="search-result-heading"
                    ><strong>${RefSubject.map(entry, (value) => value.title)}</strong
                    ><span class="search-kind">${RefSubject.map(entry, kindLabel)}</span></span
                  >
                  <span class="search-result-meta"
                    >${RefSubject.map(entry, (value) => value.specifier ?? value.section ?? value.kind)}</span
                  >
                  <span class="search-description">${RefSubject.map(entry, description)}</span>
                </a>
                ${Fx.switchMap(entry, (value) =>
                  value.related?.length
                    ? html`<div
                        class="search-related"
                        role="group"
                        aria-label="More about ${value.title}"
                      >
                        ${value.related.map((related) => html`<a href=${siteHref(related.href)} @click=${Dialog.close(state)}>${related.destination ?? related.kind}</a>`)}
                      </div>`
                    : Fx.null,
                )}
              </li>`,
            )}
          </ul>
        </div>
        <div class="search-footer" id="docs-search-help">
          <span><kbd>↑</kbd><kbd>↓</kbd> Navigate</span><span><kbd>↵</kbd> Open</span
          ><span
            ><kbd>Esc</kbd> ${RefSubject.map(query, (value) => (value ? "Clear" : "Close"))}</span
          >
        </div>`,
    })}
  </div>`;
});
