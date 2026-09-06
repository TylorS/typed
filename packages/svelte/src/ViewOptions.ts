import type { RootEventOptions } from "@typed/template/RootEvents";

/** Svelte mount, hydration and SSR options for one island. */
export interface ViewOptions {
  /** Stable, nonempty host id, unique among islands in the rendered page. Use the same id on server and client. */
  readonly id: string;
  /** Per-event bubbling policy at the automatic host. Inherits CurrentRootEvents when omitted. */
  readonly stopPropagation?: RootEventOptions;
  readonly context?: Map<any, any>;
  readonly idPrefix?: string;
  readonly intro?: boolean;
  readonly recover?: boolean;
  readonly transformError?: (error: unknown) => unknown;
  /** Receives Svelte's native head output when this island is server-rendered. */
  readonly onHead?: (head: string) => void;
  readonly outro?: boolean;
  readonly csp?: {
    readonly nonce?: string;
    readonly hash?: boolean;
  };
}
