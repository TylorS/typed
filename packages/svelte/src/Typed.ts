import type { Renderable } from "@typed/template/Renderable";
import type { RenderTemplate } from "@typed/template/RenderTemplate";
import type { Runtime } from "./Runtime.js";
import type * as Scope from "effect/Scope";
import type { AttachmentOptions } from "./Attachment.js";

/** Props for the Svelte component that embeds a Typed renderable. */
export interface TypedProps<V extends Renderable.Any, ER = never> extends AttachmentOptions<
  Renderable.Error<V> | ER
> {
  readonly runtime?: Runtime<
    Exclude<Exclude<Renderable.Services<V>, RenderTemplate>, Scope.Scope>,
    ER
  >;
  readonly value: V;

  /** Optional host id; defaults to Svelte $props.id(), stable during SSR and hydration. */
  readonly id?: string;
}
