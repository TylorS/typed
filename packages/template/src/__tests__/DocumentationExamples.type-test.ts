import { Context, Effect, Layer, Option, Scope } from "effect";
import { Fx } from "@typed/fx";
import * as RefSubject from "@typed/fx/RefSubject";
import * as EventHandler from "@typed/template/EventHandler";
import { makeEventSource } from "@typed/template/EventSource";
import {
  HtmlRenderTemplate,
  renderToHtml,
  renderToHtmlString,
  StaticHtmlRenderTemplate,
} from "@typed/template/Html";
import { addTemplateHash, templateToHtmlChunks } from "@typed/template/HtmlChunk";
import { many } from "@typed/template/many";
import { parse } from "@typed/template/Parser";
import { DomRenderTemplate, render } from "@typed/template/Render";
import { isDomRenderEvent, isHtmlRenderEvent } from "@typed/template/RenderEvent";
import { html } from "@typed/template/RenderTemplate";
import { getAllSiblingsBetween } from "@typed/template/Wire";

// The public documentation uses this complete render pipeline for DOM examples.
const countProgram = Effect.gen(function* () {
  const count = yield* RefSubject.make(0);
  const view = html`<button onclick=${RefSubject.increment(count)}>${count}</button>`;

  return yield* render(view, document.body).pipe(
    Fx.drainLayer,
    Layer.provide(DomRenderTemplate),
    Layer.launch,
  );
});

// The RenderTemplate service example performs the same work without Effect.gen.
const browserApp = render(html`<div>Hello</div>`, document.body).pipe(
  Fx.drainLayer,
  Layer.provide(DomRenderTemplate),
  Layer.launch,
);

// Exact public RenderEvent example: inspect the optional first event, then
// return the Fx that Fx.gen runs after setup.
const template = html`<div>Hello</div>`;
const program = Fx.gen(function* () {
  const maybeEvent = yield* Fx.first(template);

  return Option.match(maybeEvent, {
    onNone: () => Fx.empty,
    onSome: (event) => {
      if (isDomRenderEvent(event)) {
        const nodes = event.valueOf();
        console.log(nodes);
      } else if (isHtmlRenderEvent(event)) {
        const html = event.toString();
        console.log(html);
      }

      // Fx.gen setup must return the Fx that runs afterward.
      return Fx.succeed(event);
    },
  });
});

// Streaming SSR keeps Fx provision distinct from the Effect returned by collection.
const streamedHtml = Effect.scoped(
  Effect.gen(function* () {
    const chunks = yield* renderToHtml(html`<p>${"streamed"}</p>`).pipe(
      Fx.provide(HtmlRenderTemplate),
      Fx.collectAll,
    );
    return chunks.join("");
  }),
);

// String SSR and both HTML layers are Effects and require a Scope while running.
const hydratableHtml = Effect.scoped(
  renderToHtmlString(html`<p>${"hydratable"}</p>`).pipe(Effect.provide(HtmlRenderTemplate)),
);

const staticHtml = Effect.runPromise(
  Effect.scoped(
    renderToHtmlString(html`<p>static</p>`).pipe(Effect.provide(StaticHtmlRenderTemplate)),
  ),
);

interface Database {
  readonly save: (data: string) => Effect.Effect<void>;
}

const Database = Context.Service<Database>("Database");
const saveHandler = EventHandler.make((_event) =>
  Effect.gen(function* () {
    const database = yield* Database;
    yield* database.save("data");
  }),
);
const databaseServices = Context.make(Database, {
  save: (data) => Effect.sync(() => console.log(data)),
});
const providedHandler = EventHandler.provide(saveHandler, databaseServices);

const eventSourceProgram = Effect.scoped(
  Effect.gen(function* () {
    const eventSource = makeEventSource();
    const button = document.createElement("button");
    eventSource.addEventListener(
      button,
      "click",
      EventHandler.make(() => Effect.void),
    );
    yield* eventSource.setup(button, yield* Scope.Scope);
  }),
);

// Parser and HTML-chunk examples describe interpolation boundaries explicitly.
const parsed = parse(["<div>Hello ", "</div>"]);
const chunks = templateToHtmlChunks(parsed);
const hydratableChunks = addTemplateHash(chunks, parsed);

interface Todo {
  readonly id: string;
  readonly text: string;
  readonly completed: boolean;
}

const listProgram = Effect.gen(function* () {
  const todos = yield* RefSubject.make<ReadonlyArray<Todo>>([
    { id: "1", text: "Learn Effect", completed: false },
  ]);
  const list = many(
    todos,
    (todo) => todo.id,
    (todo) => html`<li>${RefSubject.map(todo, (value) => value.text)}</li>`,
  );

  return yield* render(
    html`<ul>
      ${list}
    </ul>`,
    document.body,
  ).pipe(Fx.drainLayer, Layer.provide(DomRenderTemplate), Layer.launch);
});

// Wire utilities borrow the exact nodes in an existing DOM range.
const parent = document.createElement("div");
const startComment = document.createComment("start");
const child = document.createElement("span");
const endComment = document.createComment("end");
parent.append(startComment, child, endComment);
const siblings = getAllSiblingsBetween(startComment, endComment);

void countProgram;
void browserApp;
void program;
void streamedHtml;
void hydratableHtml;
void staticHtml;
void providedHandler;
void eventSourceProgram;
void hydratableChunks;
void listProgram;
void siblings;
