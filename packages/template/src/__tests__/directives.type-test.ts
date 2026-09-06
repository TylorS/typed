import * as Effect from "effect/Effect";
import type * as Scope from "effect/Scope";
import type * as Fx from "@typed/fx/Fx";
import { EventHandler, html, type RenderTemplate } from "@typed/template";

type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Assert<T extends true> = T;

type HandlerService = { readonly HandlerService: unique symbol };

declare const onclick: EventHandler.EventHandler<MouseEvent, "handler-error", HandlerService>;
declare const label: Fx.Fx<string, never, never>;

const eventButton = html`<button onclick=${onclick}>Click</button>`;
type _EventErrors = Assert<Equal<Fx.Error<typeof eventButton>, "handler-error">>;
type _EventServices = Assert<
  Equal<
    Fx.Services<typeof eventButton>,
    HandlerService | Scope.Scope | RenderTemplate
  >
>;

const effectEvent = html`<button onclick=${Effect.void}>Click</button>`;
const booleanDiv = html`<div ?hidden=${true}></div>`;
const refDiv = html`<div ref=${(_element: HTMLElement) => undefined}></div>`;
const spreadDiv = html`<div ...${{ id: "safe" }}></div>`;
const dataDiv = html`<div .data=${{ safe: "value" }}></div>`;
const nodeDiv = html`<div>${label}</div>`;

void effectEvent;
void booleanDiv;
void refDiv;
void spreadDiv;
void dataDiv;

type _NodeServices = Assert<
  Equal<Fx.Services<typeof nodeDiv>, Scope.Scope | RenderTemplate>
>;

// Primitive Renderables compile in every slot; runtime SSR/DOM policy still escapes or omits unsafe values.
const _stringAttribute = html`<button onclick=${"alert(1)"}>Click</button>`;
const _stringBoolean = html`<div ?hidden=${"yes"}></div>`;
const _stringRef = html`<div ref=${"not-a-ref"}></div>`;
const _stringSpread = html`<div ...${"props"}></div>`;
const _stringData = html`<div .data=${"value"}></div>`;
const _eventNode = html`<div>${onclick}</div>`;
